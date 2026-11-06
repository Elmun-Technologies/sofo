import { cache } from "react";
import { cardInclude, getCards, toCard, type TitleCard } from "../catalog";
import { db, listHas } from "../db";
import type { Edition } from "../editions";
import { qualityGate } from "../quality-gate";
import { computeShortAnswer, notOn, type AnswerOffer, type LangState } from "../short-answer";

export type OfferView = {
  id: number;
  service: { id: number; slug: string; name: string; logoPath: string | null };
  type: "subscription" | "free" | "ads" | "rent" | "buy";
  quality: string | null;
  price: number | null;
  currency: string | null;
  /** Cheapest plan of the service in the edition country (ranks subscriptions) */
  planPrice: number | null;
  url: string;
  leavingAt: Date | null;
  checkedAt: Date;
  /** lang → status, per kind */
  audio: Record<string, LangState>;
  subtitle: Record<string, LangState>;
};

export type HistoryEvent = {
  id: string;
  type: string;
  serviceSlug: string;
  serviceName: string;
  offerType: string | null;
  before: unknown;
  after: unknown;
  occurredAt: Date;
};

/** Everything the film/dizi page renders. Cached per request (metadata + page share it). */
export const getTitlePage = cache(async (e: Edition, type: "movie" | "tv", slug: string) => {
  const loc = await db.titleLocalization.findUnique({
    where: { lang_slug: { lang: e.contentLang, slug } },
    select: { titleId: true },
  });
  if (!loc) return null;

  const title = await db.title.findUnique({
    where: { id: loc.titleId },
    include: {
      localizations: true,
      offers: {
        where: { countryCode: e.country, isActive: true, seasonId: null, episodeId: null },
        include: { service: { include: { countries: { where: { countryCode: e.country } } } }, languages: true },
      },
      seasons: { orderBy: { number: "asc" }, include: { episodes: { orderBy: { number: "asc" } }, offers: { where: { countryCode: e.country, isActive: true }, include: { languages: true, service: true } } } },
      credits: { include: { person: true }, orderBy: { order: "asc" } },
      videos: { where: { site: "youtube", isOfficial: true, seasonId: null }, orderBy: { publishedAt: "desc" } },
      events: { where: { countryCode: e.country }, include: { service: true }, orderBy: { occurredAt: "desc" } },
      releases: { where: { countryCode: e.country }, orderBy: { date: "asc" } },
      franchise: { include: { items: { orderBy: { releaseOrder: "asc" }, include: { title: { include: cardInclude(e) } } } } },
    },
  });
  if (!title || title.type !== type) return null;

  const local = title.localizations.find((l) => l.lang === e.contentLang)!;
  const en = title.localizations.find((l) => l.lang === "en");

  const offers: OfferView[] = title.offers
    .map((o) => {
      const audio: Record<string, LangState> = {};
      const subtitle: Record<string, LangState> = {};
      for (const l of o.languages) (l.kind === "audio" ? audio : subtitle)[l.lang] = l.status;
      return {
        id: o.id,
        service: { id: o.service.id, slug: o.service.slug, name: o.service.name, logoPath: o.service.logoPath },
        type: o.type,
        quality: o.quality,
        price: o.price ? Number(o.price) : null,
        currency: o.currency,
        planPrice: o.service.countries[0]?.priceFrom ? Number(o.service.countries[0].priceFrom) : null,
        url: o.url,
        leavingAt: o.leavingAt,
        checkedAt: o.checkedAt,
        audio,
        subtitle,
      };
    })
    // Cheapest first: free < ads < subscription (by plan price) < rent < buy (by price).
    .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || (a.price ?? a.planPrice ?? 0) - (b.price ?? b.planPrice ?? 0));

  const answerOffers: AnswerOffer[] = offers.map((o) => ({
    serviceSlug: o.service.slug,
    serviceName: o.service.name,
    type: o.type,
    price: o.price ?? o.planPrice,
    currency: o.currency,
    url: o.url,
    audio: o.audio[e.contentLang] ?? "unknown",
    subtitle: o.subtitle[e.contentLang] ?? "unknown",
  }));

  const coreServices = await db.service.findMany({ where: { slug: { in: e.coreServices } }, select: { slug: true, name: true } });
  const missing = notOn(answerOffers, e.coreServices.map((s) => coreServices.find((c) => c.slug === s)).filter((s): s is { slug: string; name: string } => !!s));
  const lastRemoved = new Map<string, Date>();
  for (const ev of title.events) if (ev.type === "removed" && !lastRemoved.has(ev.service.slug)) lastRemoved.set(ev.service.slug, ev.occurredAt);

  const events: HistoryEvent[] = title.events.map((ev) => ({
    id: String(ev.id),
    type: ev.type,
    serviceSlug: ev.service.slug,
    serviceName: ev.service.name,
    offerType: ev.offerType,
    before: ev.before,
    after: ev.after,
    occurredAt: ev.occurredAt,
  }));

  const gate = qualityGate({
    name: local.name,
    overview: local.overview,
    posterPath: title.posterPath,
    year: title.year,
    activeOfferCheckedAt: offers.map((o) => o.checkedAt),
  });

  return {
    title,
    local,
    en,
    offers,
    shortAnswer: computeShortAnswer(answerOffers),
    notOn: missing.map((s) => ({ ...s, leftAt: lastRemoved.get(s.slug) ?? null })),
    events,
    gate,
    checkedAt: offers.reduce<Date | null>((max, o) => (!max || o.checkedAt > max ? o.checkedAt : max), null),
    franchiseCards: (title.franchise?.items ?? []).map((i) => toCard(i.title)).filter((c): c is TitleCard => !!c),
  };
});

const TYPE_ORDER: Record<OfferView["type"], number> = { free: 0, ads: 1, subscription: 2, rent: 3, buy: 4 };

export type TitlePageData = NonNullable<Awaited<ReturnType<typeof getTitlePage>>>;

/** "If you liked …": same genre family, prefer edition-language dub, excluding itself. */
export async function getSimilar(e: Edition, titleId: number, genres: string[], take = 6): Promise<TitleCard[]> {
  const pool = await getCards(e, { id: { not: titleId }, OR: genres.map((g) => ({ genres: listHas(g) })), offers: { some: { countryCode: e.country, isActive: true } } }, { take: 30 });
  const overlap = (c: TitleCard) => c.genres.filter((g) => genres.includes(g)).length;
  return pool.sort((a, b) => Number(b.dub) - Number(a.dub) || overlap(b) - overlap(a)).slice(0, take);
}
