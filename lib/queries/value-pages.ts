/**
 * Queries for the value pages (PRD §7): season, new & leaving, trailers hub,
 * release tracker, franchise watch order, person filmography.
 */
import type { LangKind, LangStatus, OfferType, Prisma, ReleaseStage } from "@prisma/client";
import { cardInclude, getCardsByIds, toCard, type CardRow, type TitleCard } from "@/lib/catalog";
import { db } from "@/lib/db";
import type { Edition } from "@/lib/editions";
import { computeShortAnswer, type LangState } from "@/lib/short-answer";

const DAY = 86_400_000;
const TZ = "Europe/Istanbul";

// ───────────────────────── Shared: where to watch ─────────────────────────

/** One active offer, reduced to what a "where to watch" row needs. */
export type WatchOption = {
  serviceSlug: string;
  serviceName: string;
  logoPath: string | null;
  type: OfferType;
  price: number | null;
  currency: string | null;
  url: string;
  quality: string | null;
  checkedAt: Date;
  leavingAt: Date | null;
  /** Edition-language audio / subtitle status — never guessed */
  audio: LangState;
  subtitle: LangState;
};

type OfferLike = {
  type: OfferType;
  price: Prisma.Decimal | null;
  currency: string | null;
  url: string;
  quality: string | null;
  checkedAt: Date;
  leavingAt: Date | null;
  service: { slug: string; name: string; logoPath: string | null };
  languages: { lang: string; kind: LangKind; status: LangStatus }[];
};

export function langStatus(languages: OfferLike["languages"], lang: string, kind: LangKind): LangState {
  return languages.find((l) => l.lang === lang && l.kind === kind)?.status ?? "unknown";
}

export function toWatchOption(o: OfferLike, lang: string): WatchOption {
  return {
    serviceSlug: o.service.slug,
    serviceName: o.service.name,
    logoPath: o.service.logoPath,
    type: o.type,
    price: o.price ? Number(o.price) : null,
    currency: o.currency,
    url: o.url,
    quality: o.quality,
    checkedAt: o.checkedAt,
    leavingAt: o.leavingAt,
    audio: langStatus(o.languages, lang, "audio"),
    subtitle: langStatus(o.languages, lang, "subtitle"),
  };
}

/** Cheapest included offer with the edition language first (same rules as the short answer). */
export function bestOption(options: WatchOption[]): WatchOption | undefined {
  const a = computeShortAnswer(options);
  return a.kind === "none" ? undefined : (a.offer as WatchOption);
}

export type WatchTitle = { card: TitleCard; options: WatchOption[]; best: WatchOption | undefined };

function toWatchTitle(row: CardRow, e: Edition): WatchTitle | null {
  const card = toCard(row);
  if (!card) return null;
  const options = row.offers.map((o) => toWatchOption(o, e.contentLang));
  return { card, options, best: bestOption(options) };
}

// ───────────────────────── Dates (edition time zone) ─────────────────────────

/** YYYY-MM-DD in the edition time zone. */
export function dayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Noon UTC of a YYYY-MM-DD key — safe anchor for day arithmetic. */
function keyToDate(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

export function addDays(key: string, n: number): string {
  return new Date(keyToDate(key).getTime() + n * DAY).toISOString().slice(0, 10);
}

/** Monday-first week containing `key`, as 7 day keys. */
export function weekOf(key: string): string[] {
  const dow = (keyToDate(key).getUTCDay() + 6) % 7; // Mon = 0
  const monday = addDays(key, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ───────────────────────── 1. Season ─────────────────────────

export type LangRow = { lang: string; cells: { serviceSlug: string; audio: LangState; subtitle: LangState }[] };

export async function getSeasonPage(e: Edition, slug: string, number: number) {
  const loc = await db.titleLocalization.findUnique({
    where: { lang_slug: { lang: e.contentLang, slug } },
    include: {
      title: {
        include: {
          seasons: { orderBy: { number: "asc" }, select: { id: true, number: true, name: true, episodeCount: true, airDate: true } },
          videos: { where: { site: "youtube", isOfficial: true }, orderBy: [{ publishedAt: "desc" }, { id: "asc" }] },
          offers: {
            where: { countryCode: e.country, isActive: true, seasonId: null },
            include: { service: true, languages: true },
          },
        },
      },
    },
  });
  if (!loc || loc.title.type !== "tv") return null;
  const title = loc.title;

  const season = await db.season.findUnique({
    where: { titleId_number: { titleId: title.id, number } },
    include: {
      episodes: { orderBy: { number: "asc" } },
      offers: {
        where: { countryCode: e.country, isActive: true, episodeId: null },
        include: { service: true, languages: true },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!season) return null;

  // Season-level offers are the source of truth; fall back to series-level offers (labelled as such).
  const seasonLevel = season.offers.length > 0;
  const offerRows = seasonLevel ? season.offers : title.offers;
  const options = offerRows.map((o) => toWatchOption(o, e.contentLang));

  // Language matrix: every language any service reports for this season.
  const langs = new Set<string>([e.contentLang, title.originalLang]);
  for (const o of offerRows) for (const l of o.languages) langs.add(l.lang);
  const ordered = [...langs].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  function rank(l: string) {
    return l === e.contentLang ? 0 : l === title.originalLang ? 1 : 2;
  }
  const services = [...new Map(offerRows.map((o) => [o.service.slug, o.service])).values()];
  const matrix: LangRow[] = ordered.map((lang) => ({
    lang,
    cells: services.map((s) => {
      const rows = offerRows.filter((o) => o.service.slug === s.slug);
      return { serviceSlug: s.slug, audio: mergeStatus(rows.map((r) => langStatus(r.languages, lang, "audio"))), subtitle: mergeStatus(rows.map((r) => langStatus(r.languages, lang, "subtitle"))) };
    }),
  }));

  const video =
    title.videos.find((v) => v.seasonId === season.id && v.episodeId === null) ??
    title.videos.find((v) => v.seasonId === null && v.episodeId === null && (v.kind === "trailer" || v.kind === "teaser"));

  return {
    title: {
      id: title.id,
      tmdbId: title.tmdbId,
      name: loc.name,
      slug: loc.slug,
      originalTitle: title.originalTitle,
      originalLang: title.originalLang,
      year: title.year,
      posterPath: title.posterPath,
      backdropPath: title.backdropPath,
    },
    seasons: title.seasons,
    season: {
      id: season.id,
      number: season.number,
      name: season.name,
      airDate: season.airDate,
      episodeCount: season.episodeCount,
      score: season.tmdbScore ? Number(season.tmdbScore) : null,
      posterPath: season.posterPath ?? title.posterPath,
    },
    episodes: season.episodes.map((ep) => ({
      id: ep.id,
      number: ep.number,
      name: ep.name,
      overview: ep.overview,
      airDate: ep.airDate,
      runtimeMin: ep.runtimeMin,
      score: ep.tmdbScore ? Number(ep.tmdbScore) : null,
      stillPath: ep.stillPath,
    })),
    seasonLevel,
    options,
    best: bestOption(options),
    services: services.map((s) => ({ slug: s.slug, name: s.name, logoPath: s.logoPath })),
    matrix,
    video: video ? { key: video.key, name: video.name, lang: video.lang, kind: video.kind, durationSec: video.durationSec } : null,
  };
}

/** Across several offers of one service: yes wins, then no only if all say no, else unknown. */
function mergeStatus(states: LangState[]): LangState {
  if (states.includes("confirmed_yes")) return "confirmed_yes";
  if (states.length > 0 && states.every((s) => s === "confirmed_no")) return "confirmed_no";
  return "unknown";
}

// ───────────────────────── 2. New & leaving ─────────────────────────

export type CalendarItem = {
  key: string;
  kind: "new" | "new_dub" | "leaving";
  day: string;
  card: TitleCard;
  service: { slug: string; name: string; logoPath: string | null };
  date: Date;
};

export async function getNewLeaving(e: Edition, opts: { service?: string; dubOnly?: boolean; now?: Date }) {
  const now = opts.now ?? new Date();
  const today = dayKey(now);
  const serviceWhere = opts.service ? { service: { slug: opts.service } } : {};

  const [events, leavingOffers] = await Promise.all([
    db.availabilityEvent.findMany({
      where: { countryCode: e.country, type: { in: ["added", "audio_added"] }, occurredAt: { gte: new Date(now.getTime() - 14 * DAY) }, ...serviceWhere },
      include: { service: true },
      orderBy: { occurredAt: "desc" },
    }),
    db.offer.findMany({
      where: {
        countryCode: e.country,
        isActive: true,
        seasonId: null,
        leavingAt: { gte: keyToDate(addDays(today, -7)), lte: new Date(now.getTime() + 30 * DAY) },
        ...serviceWhere,
      },
      include: { service: true },
      orderBy: [{ leavingAt: "asc" }, { id: "asc" }],
    }),
  ]);

  const cards = await getCardsByIds(e, [...new Set([...events.map((x) => x.titleId), ...leavingOffers.map((o) => o.titleId)])]);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const svc = (s: { slug: string; name: string; logoPath: string | null }) => ({ slug: s.slug, name: s.name, logoPath: s.logoPath });

  // Only edition-language dubs count as "new dub".
  const isEditionDub = (after: Prisma.JsonValue) =>
    !!after && typeof after === "object" && !Array.isArray(after) && (after as Record<string, unknown>).lang === e.contentLang;

  const seen = new Set<string>();
  const added: CalendarItem[] = [];
  for (const ev of events) {
    const card = byId.get(ev.titleId);
    if (!card) continue;
    const kind = ev.type === "audio_added" ? "new_dub" : "new";
    if (kind === "new_dub" && !isEditionDub(ev.after)) continue;
    const k = `${kind}-${ev.titleId}-${ev.serviceId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (opts.dubOnly && kind !== "new_dub" && !card.dub) continue;
    added.push({ key: k, kind, day: dayKey(ev.occurredAt), card, service: svc(ev.service), date: ev.occurredAt });
  }

  const leaving: CalendarItem[] = [];
  for (const o of leavingOffers) {
    const card = byId.get(o.titleId);
    if (!card || !o.leavingAt) continue;
    const k = `leaving-${o.titleId}-${o.serviceId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (opts.dubOnly && !card.dub) continue;
    leaving.push({ key: k, kind: "leaving", day: o.leavingAt.toISOString().slice(0, 10), card, service: svc(o.service), date: o.leavingAt });
  }

  return { today, added, leaving, leavingSoon: leaving.filter((l) => l.day >= today) };
}

// ───────────────────────── 3. Trailers hub ─────────────────────────

export type TrailerItem = {
  id: number;
  key: string;
  name: string;
  kind: string;
  lang: string | null;
  durationSec: number | null;
  publishedAt: Date | null;
  isVertical: boolean;
  title: WatchTitle;
};

export async function getTrailers(e: Edition, opts: { lang?: string } = {}) {
  const where: Prisma.VideoWhereInput = {
    site: "youtube",
    isOfficial: true,
    episodeId: null,
    title: { localizations: { some: { lang: e.contentLang } } },
  };
  const [videos, langRows] = await Promise.all([
    db.video.findMany({
      where: { ...where, ...(opts.lang ? { lang: opts.lang } : {}) },
      include: { title: { include: cardInclude(e) } },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      take: 60,
    }),
    db.video.findMany({ where, distinct: ["lang"], select: { lang: true } }),
  ]);
  const items: TrailerItem[] = [];
  for (const v of videos) {
    const title = toWatchTitle(v.title, e);
    if (!title) continue;
    items.push({ id: v.id, key: v.key, name: v.name, kind: v.kind, lang: v.lang, durationSec: v.durationSec, publishedAt: v.publishedAt, isVertical: v.isVertical, title });
  }
  const langs = langRows.map((r) => r.lang).filter((l): l is string => !!l);
  // Edition language first.
  langs.sort((a, b) => (a === e.contentLang ? -1 : b === e.contentLang ? 1 : a.localeCompare(b)));
  return { items, langs };
}

// ───────────────────────── 4. Release tracker ─────────────────────────

export const STAGE_ORDER: ReleaseStage[] = ["theatrical", "digital", "subscription", "dub"];

export type TrackStage = {
  stage: ReleaseStage;
  date: Date | null;
  isEstimate: boolean;
  service: string | null;
  lang: string | null;
  source: string;
  past: boolean;
};

export type TrackedTitle = { card: TitleCard; stages: TrackStage[]; next: TrackStage; hasDub: boolean };

export async function getReleaseTracker(e: Edition, opts: { type?: "movie" | "tv"; dubOnly?: boolean; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const today = keyToDate(dayKey(now));
  today.setUTCHours(0, 0, 0, 0);

  const rows = await db.releaseTrack.findMany({
    where: { countryCode: e.country, ...(opts.type ? { title: { type: opts.type } } : {}) },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
  const serviceIds = [...new Set(rows.map((r) => r.serviceId).filter((x): x is number => x !== null))];
  const services = new Map((await db.service.findMany({ where: { id: { in: serviceIds } } })).map((s) => [s.id, s.name]));

  const byTitle = new Map<number, typeof rows>();
  for (const r of rows) byTitle.set(r.titleId, [...(byTitle.get(r.titleId) ?? []), r]);

  const cards = new Map((await getCardsByIds(e, [...byTitle.keys()])).map((c) => [c.id, c]));
  const tracked: TrackedTitle[] = [];
  for (const [titleId, list] of byTitle) {
    const card = cards.get(titleId);
    if (!card) continue;
    // Only the edition-language dub stage is shown on this edition.
    const stages = list
      .filter((r) => r.stage !== "dub" || r.lang === e.contentLang)
      .map<TrackStage>((r) => ({
        stage: r.stage,
        date: r.date,
        isEstimate: r.isEstimate,
        service: r.serviceId ? (services.get(r.serviceId) ?? null) : null,
        lang: r.lang,
        source: r.source,
        past: !!r.date && r.date < today,
      }))
      .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
    const next = stages.filter((s) => s.date && !s.past).sort((a, b) => a.date!.getTime() - b.date!.getTime())[0];
    if (!next) continue;
    const hasDub = stages.some((s) => s.stage === "dub");
    if (opts.dubOnly && !hasDub) continue;
    tracked.push({ card, stages, next, hasDub });
  }
  tracked.sort((a, b) => a.next.date!.getTime() - b.next.date!.getTime());

  const months = new Map<string, TrackedTitle[]>();
  for (const t of tracked) {
    const k = t.next.date!.toISOString().slice(0, 7);
    months.set(k, [...(months.get(k) ?? []), t]);
  }
  return {
    months: [...months.entries()].map(([month, titles]) => ({
      month,
      titles,
      dubs: titles.filter((t) => t.next.stage === "dub").length,
    })),
  };
}

// ───────────────────────── 5. Franchise ─────────────────────────

export async function getFranchisePage(e: Edition, slug: string) {
  const f = await db.franchise.findUnique({
    where: { slug },
    include: { items: { include: { title: { include: cardInclude(e) } } } },
  });
  if (!f) return null;
  const items = f.items
    .map((it) => {
      const t = toWatchTitle(it.title, e);
      return t
        ? { ...t, releaseOrder: it.releaseOrder, storyOrder: it.storyOrder ?? it.releaseOrder, kind: it.kind, runtimeMin: it.title.runtimeMin, backdropPath: it.title.backdropPath }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const others = await db.franchise.findMany({ where: { id: { not: f.id } }, select: { name: true, slug: true }, orderBy: { name: "asc" }, take: 8 });
  return { id: f.id, name: f.name, slug: f.slug, items, others };
}

/** Smallest set of services (greedy) whose included offers cover every watchable item. */
export function coveringServices(items: WatchTitle[]): { services: { slug: string; name: string }[]; covered: number } {
  const included = new Set(["subscription", "free", "ads"]);
  const sets = new Map<string, { name: string; ids: Set<number> }>();
  for (const it of items)
    for (const o of it.options) {
      if (!included.has(o.type)) continue;
      const s = sets.get(o.serviceSlug) ?? { name: o.serviceName, ids: new Set<number>() };
      s.ids.add(it.card.id);
      sets.set(o.serviceSlug, s);
    }
  const remaining = new Set([...sets.values()].flatMap((s) => [...s.ids]));
  const covered = remaining.size;
  const chosen: { slug: string; name: string }[] = [];
  while (remaining.size > 0) {
    let best: [string, number] | null = null;
    for (const [slug, s] of sets) {
      const gain = [...s.ids].filter((id) => remaining.has(id)).length;
      if (gain > 0 && (!best || gain > best[1])) best = [slug, gain];
    }
    if (!best) break;
    const s = sets.get(best[0])!;
    chosen.push({ slug: best[0], name: s.name });
    for (const id of s.ids) remaining.delete(id);
  }
  return { services: chosen, covered };
}

// ───────────────────────── 6. Person ─────────────────────────

export async function getPersonPage(e: Edition, slug: string) {
  const p = await db.person.findUnique({
    where: { slug },
    include: { credits: { include: { title: { include: cardInclude(e) } }, orderBy: { order: "asc" } } },
  });
  if (!p) return null;
  const credits = p.credits
    .map((c) => {
      const t = toWatchTitle(c.title, e);
      return t ? { ...t, id: c.id, job: c.job, character: c.character, popularity: c.title.popularity ?? 0 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { id: p.id, name: p.name, slug: p.slug, birthday: p.birthday, knownFor: p.knownFor, credits };
}
