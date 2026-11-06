/**
 * Queries for catalog (/filmler, /diziler, /anime), language hubs, collections, service pages and kids.
 */
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { availableWhere, cardInclude, getCards, getServices, langWhere, toCard, type TitleCard } from "../catalog";
import { db, listHas } from "../db";
import { getEdition, type Edition } from "../editions";
import { slugify } from "../slug";
import { DECADES } from "@/components/catalog/catalog-url";

const DAY = 86_400_000;

// ───────────────────────── Catalog ─────────────────────────

export type CatalogKind = "movies" | "series" | "anime";
export type AudioFilter = "dub" | "sub";
export type OfferFilter = "subscription" | "free" | "rent" | "buy";
export type SortKey = "popular" | "newest" | "top";

export type CatalogFilters = {
  genre?: string;
  service?: string;
  audio?: AudioFilter;
  offer?: OfferFilter;
  /** Decade start (2020 → 2020–2029); 0 = before 1990 */
  decade?: number;
  sort: SortKey;
  page: number;
};

export const PAGE_SIZE = 30;
const AUDIO: AudioFilter[] = ["dub", "sub"];
const OFFERS: OfferFilter[] = ["subscription", "free", "rent", "buy"];
const SORTS: SortKey[] = ["popular", "newest", "top"];

type RawParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parses URL params; unknown values are dropped (never trusted). */
export function parseCatalogParams(e: Edition, sp: RawParams): CatalogFilters {
  const audio = one(sp.audio);
  const offer = one(sp.offer);
  const sort = one(sp.sort);
  const service = one(sp.service);
  const decade = Number(one(sp.decade));
  const page = Math.max(1, Math.floor(Number(one(sp.page)) || 1));
  return {
    genre: one(sp.genre)?.toLowerCase() || undefined,
    service: service && e.coreServices.includes(service) ? service : undefined,
    audio: AUDIO.includes(audio as AudioFilter) ? (audio as AudioFilter) : undefined,
    offer: OFFERS.includes(offer as OfferFilter) ? (offer as OfferFilter) : undefined,
    decade: (DECADES as readonly number[]).includes(decade) && one(sp.decade) !== "" ? decade : undefined,
    sort: SORTS.includes(sort as SortKey) ? (sort as SortKey) : "popular",
    page,
  };
}

function kindWhere(kind: CatalogKind): Prisma.TitleWhereInput {
  if (kind === "movies") return { type: "movie" };
  if (kind === "series") return { type: "tv" };
  return { isAnimation: true, originalLang: "ja" };
}

/** Offer-level conditions are combined on ONE offer (service × type × confirmed language). */
function offerWhere(e: Edition, f: Pick<CatalogFilters, "service" | "audio" | "offer">): Prisma.OfferWhereInput {
  return {
    countryCode: e.country,
    isActive: true,
    seasonId: null,
    ...(f.service ? { service: { slug: f.service } } : {}),
    ...(f.offer ? { type: f.offer === "free" ? { in: ["free", "ads"] } : f.offer } : {}),
    ...(f.audio
      ? { languages: { some: { lang: e.contentLang, kind: f.audio === "dub" ? "audio" : "subtitle", status: "confirmed_yes" } } }
      : {}),
  };
}

function genreValue(genres: string[], slug: string | undefined): string | undefined {
  return slug ? genres.find((g) => slugify(g) === slug) : undefined;
}

function decadeWhere(d: number | undefined): Prisma.TitleWhereInput {
  if (d == null) return {};
  return d === 0 ? { year: { lt: 1990 } } : { year: { gte: d, lt: d + 10 } };
}

function catalogWhere(e: Edition, kind: CatalogKind, f: CatalogFilters, genre: string | undefined): Prisma.TitleWhereInput {
  return {
    ...kindWhere(kind),
    ...decadeWhere(f.decade),
    ...(genre ? { genres: listHas(genre) } : {}),
    offers: { some: offerWhere(e, f) },
  };
}

const ORDER: Record<SortKey, Prisma.TitleOrderByWithRelationInput[]> = {
  popular: [{ popularity: { sort: "desc", nulls: "last" } }, { id: "asc" }],
  newest: [{ year: { sort: "desc", nulls: "last" } }, { popularity: { sort: "desc", nulls: "last" } }, { id: "asc" }],
  top: [{ tmdbScore: { sort: "desc", nulls: "last" } }, { id: "asc" }],
};

/** Genres present among available titles of this kind. */
async function kindGenres(e: Edition, kind: CatalogKind): Promise<string[]> {
  const rows = await db.title.findMany({
    where: { ...kindWhere(kind), ...availableWhere(e), localizations: { some: { lang: e.contentLang } } },
    select: { genres: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) for (const g of r.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
}

export type CatalogResult = {
  cards: TitleCard[];
  total: number;
  pages: number;
  genres: { slug: string; name: string }[];
  services: { slug: string; name: string; logoPath: string | null; count: number }[];
  audioCounts: Record<AudioFilter, number>;
  serviceCount: number;
  /** Resolved genre display name (undefined if the slug is unknown) */
  genreName?: string;
};

/** Deduped per request (generateMetadata + page) — keyed by primitives. */
export function getCatalog(e: Edition, kind: CatalogKind, f: CatalogFilters): Promise<CatalogResult> {
  return cachedCatalog(e.code, kind, JSON.stringify(f));
}

const cachedCatalog = cache((code: string, kind: CatalogKind, json: string) => loadCatalog(getEdition(code)!, kind, JSON.parse(json) as CatalogFilters));

async function loadCatalog(e: Edition, kind: CatalogKind, f: CatalogFilters): Promise<CatalogResult> {
  const [genres, services] = await Promise.all([kindGenres(e, kind), getServices(e)]);
  const genre = genreValue(genres, f.genre);
  const effective: CatalogFilters = { ...f, genre: genre ? f.genre : undefined };
  const base = { localizations: { some: { lang: e.contentLang } } } satisfies Prisma.TitleWhereInput;
  const where = { ...base, ...catalogWhere(e, kind, effective, genre) };
  const count = (w: Prisma.TitleWhereInput) => db.title.count({ where: { ...base, ...w } });

  const [total, rows, serviceCounts, dubCount, subCount] = await Promise.all([
    db.title.count({ where }),
    db.title.findMany({ where, include: cardInclude(e), orderBy: ORDER[f.sort], take: PAGE_SIZE, skip: (f.page - 1) * PAGE_SIZE }),
    // Facet counts ignore their own dimension so every option shows what it would add.
    Promise.all(services.map((s) => count(catalogWhere(e, kind, { ...effective, service: s.slug }, genre)))),
    count(catalogWhere(e, kind, { ...effective, audio: "dub" }, genre)),
    count(catalogWhere(e, kind, { ...effective, audio: "sub" }, genre)),
  ]);

  return {
    cards: rows.map(toCard).filter((c): c is TitleCard => c !== null),
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    genres: genres.map((g) => ({ slug: slugify(g), name: g })),
    services: services.map((s, i) => ({ slug: s.slug, name: s.name, logoPath: s.logoPath, count: serviceCounts[i] ?? 0 })),
    audioCounts: { dub: dubCount, sub: subCount },
    serviceCount: serviceCounts.filter((n) => n > 0).length,
    genreName: genre,
  };
}

// ───────────────────────── Language hub ─────────────────────────

export type LangKindKey = "dub" | "sub";
const langKind = (k: LangKindKey) => (k === "dub" ? "audio" : "subtitle");

/** Title-level offer with confirmed edition-language audio/subtitles (optionally on one service). */
function confirmedWhere(e: Edition, k: LangKindKey, serviceSlug?: string): Prisma.TitleWhereInput {
  return {
    offers: {
      some: {
        countryCode: e.country,
        isActive: true,
        seasonId: null,
        ...(serviceSlug ? { service: { slug: serviceSlug } } : {}),
        languages: { some: { lang: e.contentLang, kind: langKind(k), status: "confirmed_yes" } },
      },
    },
  };
}

export function getLangHub(e: Edition, k: LangKindKey) {
  return cachedLangHub(e.code, k);
}

const cachedLangHub = cache((code: string, k: LangKindKey) => loadLangHub(getEdition(code)!, k));

async function loadLangHub(e: Edition, k: LangKindKey) {
  const where = confirmedWhere(e, k);
  const loc = { localizations: { some: { lang: e.contentLang } } };
  const services = await getServices(e);
  const since = new Date(Date.now() - 30 * DAY);

  const [total, serviceCounts, recentEvents, movies, series, anime, kids, lastChecked] = await Promise.all([
    db.title.count({ where: { ...loc, ...where } }),
    Promise.all(services.map((s) => db.title.count({ where: { ...loc, ...confirmedWhere(e, k, s.slug) } }))),
    db.availabilityEvent.findMany({
      where: { countryCode: e.country, type: k === "dub" ? "audio_added" : "subtitle_added", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      select: { titleId: true },
      take: 40,
    }),
    getCards(e, { ...where, type: "movie" }, { take: 18 }),
    getCards(e, { ...where, type: "tv" }, { take: 18 }),
    getCards(e, { ...where, isAnimation: true, originalLang: "ja" }, { take: 18 }),
    getCards(e, { ...where, isKids: true }, { take: 18 }),
    db.offer.aggregate({ where: { countryCode: e.country, isActive: true }, _max: { checkedAt: true } }),
  ]);

  const recentIds = [...new Set(recentEvents.map((r) => r.titleId))];
  const recentCards = recentIds.length ? await getCards(e, { id: { in: recentIds }, ...where }) : [];
  const order = new Map(recentIds.map((id, i) => [id, i]));
  recentCards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return {
    total,
    services: services.map((s, i) => ({ ...s, count: serviceCounts[i] ?? 0 })),
    recent: recentCards.slice(0, 18),
    movies,
    series,
    anime,
    kids,
    lastCheckedAt: lastChecked._max.checkedAt,
  };
}

// ───────────────────────── Collections ─────────────────────────

/** Cached per request: same Edition object + slug from generateMetadata and the page. */
export const getCollection = cache(async (e: Edition, slug: string) => {
  const list = await db.list.findFirst({
    where: { lang: e.contentLang, countryCode: e.country, slug, isPublished: true },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { title: { include: { ...cardInclude(e) } } },
      },
    },
  });
  if (!list) return null;

  const items = list.items
    .map((it) => {
      const card = toCard(it.title);
      if (!card) return null;
      const loc = it.title.localizations[0];
      // Best offer: subscription/free first, confirmed dub first, then cheapest.
      const rank = (o: (typeof it.title.offers)[number]) =>
        (o.type === "subscription" || o.type === "free" || o.type === "ads" ? 0 : 10) +
        (o.languages.some((l) => l.kind === "audio" && l.status === "confirmed_yes") ? 0 : 1);
      const best = [...it.title.offers].sort((a, b) => rank(a) - rank(b) || Number(a.price ?? 0) - Number(b.price ?? 0))[0];
      const lang = (kind: "audio" | "subtitle") =>
        it.title.offers.flatMap((o) => o.languages.filter((l) => l.kind === kind)).reduce<"confirmed_yes" | "confirmed_no" | "unknown" | undefined>(
          (acc, l) => (acc === "confirmed_yes" || l.status === "confirmed_yes" ? "confirmed_yes" : acc === "confirmed_no" || l.status === "confirmed_no" ? "confirmed_no" : "unknown"),
          undefined,
        );
      const checked = it.title.offers.map((o) => o.checkedAt.getTime());
      return {
        position: it.position,
        blurb: it.blurb,
        overview: loc?.overview ?? null,
        runtimeMin: it.title.runtimeMin,
        card,
        audio: lang("audio"),
        subtitle: lang("subtitle"),
        best: best
          ? {
              url: best.url,
              type: best.type,
              price: best.price ? Number(best.price) : null,
              currency: best.currency,
              service: { slug: best.service.slug, name: best.service.name, logoPath: best.service.logoPath },
            }
          : null,
        checkedAt: checked.length ? new Date(Math.max(...checked)) : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return { id: list.id, slug: list.slug, name: list.name, intro: list.intro, author: list.author, updatedAt: list.updatedAt, items };
});

export type CollectionData = NonNullable<Awaited<ReturnType<typeof getCollection>>>;

export async function getCollectionSlugs(e: Edition): Promise<string[]> {
  const rows = await db.list.findMany({ where: { lang: e.contentLang, countryCode: e.country, isPublished: true }, select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ───────────────────────── Service page ─────────────────────────

/** Public home pages of the core services (outbound "Go to …" button). */
const SERVICE_HOME: Record<string, string> = {
  netflix: "https://www.netflix.com/tr/",
  "prime-video": "https://www.primevideo.com/",
  "disney-plus": "https://www.disneyplus.com/tr-tr",
  "hbo-max": "https://www.hbomax.com/tr/tr",
  tod: "https://www.tod.tv/",
  tabii: "https://www.tabii.com/",
  exxen: "https://www.exxen.com/",
  gain: "https://www.gain.tv/",
};

export const getServicePage = cache(async (e: Edition, slug: string) => {
  const services = await getServices(e);
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;

  const loc = { localizations: { some: { lang: e.contentLang } } };
  const now = new Date();
  const today = new Date(now.toISOString().slice(0, 10));

  const stats = await Promise.all(
    services.map(async (s) => ({
      slug: s.slug,
      titles: await db.title.count({ where: { ...loc, ...availableWhere(e, s.slug) } }),
      dub: await db.title.count({ where: { ...loc, ...confirmedWhere(e, "dub", s.slug) } }),
      sub: await db.title.count({ where: { ...loc, ...confirmedWhere(e, "sub", s.slug) } }),
      uhd: await db.title.count({
        where: { ...loc, offers: { some: { countryCode: e.country, isActive: true, service: { slug: s.slug }, quality: "uhd" } } },
      }),
    })),
  );

  const offerBase = { countryCode: e.country, isActive: true, seasonId: null, service: { slug } } satisfies Prisma.OfferWhereInput;
  const [newOffers, leavingOffers, top, dubbed, lastChecked] = await Promise.all([
    db.offer.findMany({
      where: { ...offerBase, firstSeenAt: { gte: new Date(now.getTime() - 30 * DAY) } },
      orderBy: { firstSeenAt: "desc" },
      select: { titleId: true, firstSeenAt: true },
      take: 60,
    }),
    db.offer.findMany({
      where: { ...offerBase, leavingAt: { gte: today } },
      orderBy: { leavingAt: "asc" },
      select: { titleId: true, leavingAt: true },
      take: 40,
    }),
    getCards(e, availableWhere(e, slug), { take: 10 }),
    getCards(e, confirmedWhere(e, "dub", slug), { take: 18 }),
    db.offer.aggregate({ where: offerBase, _max: { checkedAt: true } }),
  ]);

  const uniq = <T extends { titleId: number }>(rows: T[]) => [...new Map(rows.map((r) => [r.titleId, r])).values()];
  const newRows = uniq(newOffers).slice(0, 18);
  const leavingRows = uniq(leavingOffers).slice(0, 18);
  const [newCards, leavingCards] = await Promise.all([
    getCards(e, { id: { in: newRows.map((r) => r.titleId) } }),
    getCards(e, { id: { in: leavingRows.map((r) => r.titleId) } }),
  ]);
  const ordered = <T extends { titleId: number }>(rows: T[], cards: TitleCard[]) => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    return rows.flatMap((r) => {
      const card = byId.get(r.titleId);
      return card ? [{ ...r, card }] : [];
    });
  };

  const statOf = (s: string) => stats.find((x) => x.slug === s) ?? { slug: s, titles: 0, dub: 0, sub: 0, uhd: 0 };
  return {
    service: { ...service, homeUrl: SERVICE_HOME[slug] ?? null },
    stats: statOf(slug),
    newItems: ordered(newRows, newCards),
    leaving: ordered(leavingRows, leavingCards) as { titleId: number; leavingAt: Date; card: TitleCard }[],
    top,
    dubbed,
    lastCheckedAt: lastChecked._max.checkedAt,
    others: services.filter((s) => s.slug !== slug).map((s) => ({ ...s, stats: statOf(s.slug) })),
  };
});

export type ServicePageData = NonNullable<Awaited<ReturnType<typeof getServicePage>>>;

// ───────────────────────── Kids ─────────────────────────

export async function getKidsPage(e: Edition) {
  const kids = { isKids: true, ...availableWhere(e) } satisfies Prisma.TitleWhereInput;
  const dub = langWhere(e, "audio");
  const services = await getServices(e);
  const loc = { localizations: { some: { lang: e.contentLang } } };
  const count = (w: Prisma.TitleWhereInput) => db.title.count({ where: { ...loc, ...kids, ...w } });
  const [favourites, short, series, hero, byService, counts] = await Promise.all([
    getCards(e, { ...kids, ...dub }, { take: 18 }),
    getCards(e, { ...kids, type: "movie", runtimeMin: { lt: 100 } }, { take: 18 }),
    getCards(e, { ...kids, type: "tv" }, { take: 18 }),
    getCards(e, { ...kids, posterPath: { not: null } }, { take: 3 }),
    Promise.all(services.map((s) => getCards(e, { isKids: true, ...availableWhere(e, s.slug) }, { take: 18 }))),
    Promise.all([count({}), count(dub), count({ type: "movie" }), count({ type: "tv" }), count({ type: "movie", runtimeMin: { lt: 100 } })]),
  ]);
  // Dubbed first inside each row.
  const dubFirst = (cards: TitleCard[]) => [...cards].sort((a, b) => Number(b.dub) - Number(a.dub));
  const [total, dubbed, movies, seriesCount, shortCount] = counts;
  return {
    favourites,
    short: dubFirst(short),
    series: dubFirst(series),
    hero,
    counts: { total, dub: dubbed, movies, series: seriesCount, short: shortCount },
    byService: services
      .map((s, i) => ({ slug: s.slug, name: s.name, cards: dubFirst(byService[i] ?? []) }))
      .filter((r) => r.cards.length > 0),
  };
}

