/**
 * Shared read queries for edition pages. Page-specific queries live in lib/queries/*.
 * Only active, title-level offers (seasonId = null) in the edition country count for cards.
 */
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Edition } from "./editions";

export type ServiceRef = { slug: string; name: string; logoPath: string | null };

export type TitleCard = {
  id: number;
  tmdbId: number;
  type: "movie" | "tv";
  slug: string;
  name: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  score: number | null;
  genres: string[];
  isKids: boolean;
  isAnimation: boolean;
  services: ServiceRef[];
  /** Edition language audio confirmed on at least one active offer */
  dub: boolean;
  /** Edition language subtitles confirmed on at least one active offer */
  sub: boolean;
  hasFree: boolean;
};

export const cardInclude = (e: Edition) =>
  ({
    localizations: { where: { lang: e.contentLang } },
    offers: {
      where: { countryCode: e.country, isActive: true, seasonId: null },
      include: { service: true, languages: { where: { lang: e.contentLang } } },
    },
  }) satisfies Prisma.TitleInclude;

export type CardRow = Prisma.TitleGetPayload<{ include: ReturnType<typeof cardInclude> }>;

export function toCard(row: CardRow): TitleCard | null {
  const loc = row.localizations[0];
  if (!loc) return null;
  const services = new Map<string, ServiceRef>();
  let dub = false;
  let sub = false;
  let hasFree = false;
  for (const o of row.offers) {
    services.set(o.service.slug, { slug: o.service.slug, name: o.service.name, logoPath: o.service.logoPath });
    if (o.type === "free" || o.type === "ads") hasFree = true;
    for (const l of o.languages) {
      if (l.status !== "confirmed_yes") continue;
      if (l.kind === "audio") dub = true;
      else sub = true;
    }
  }
  return {
    id: row.id,
    tmdbId: row.tmdbId,
    type: row.type,
    slug: loc.slug,
    name: loc.name,
    year: row.year,
    posterPath: row.posterPath,
    backdropPath: row.backdropPath,
    score: row.tmdbScore ? Number(row.tmdbScore) : null,
    genres: row.genres,
    isKids: row.isKids,
    isAnimation: row.isAnimation,
    services: [...services.values()],
    dub,
    sub,
    hasFree,
  };
}

export async function getCards(
  e: Edition,
  where: Prisma.TitleWhereInput = {},
  opts: { orderBy?: Prisma.TitleOrderByWithRelationInput | Prisma.TitleOrderByWithRelationInput[]; take?: number; skip?: number } = {},
): Promise<TitleCard[]> {
  const rows = await db.title.findMany({
    where: { localizations: { some: { lang: e.contentLang } }, ...where },
    include: cardInclude(e),
    orderBy: opts.orderBy ?? [{ popularity: "desc" }, { id: "asc" }],
    take: opts.take,
    skip: opts.skip,
  });
  return rows.map(toCard).filter((c): c is TitleCard => c !== null);
}

/** Cards in the order of the given ids (e.g. list items, events). */
export async function getCardsByIds(e: Edition, ids: number[]): Promise<TitleCard[]> {
  if (ids.length === 0) return [];
  const cards = await getCards(e, { id: { in: ids } });
  const byId = new Map(cards.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is TitleCard => !!c);
}

/** Where-clause: has an active offer in the edition country (optionally on one service). */
export function availableWhere(e: Edition, serviceSlug?: string): Prisma.TitleWhereInput {
  return {
    offers: {
      some: { countryCode: e.country, isActive: true, seasonId: null, ...(serviceSlug ? { service: { slug: serviceSlug } } : {}) },
    },
  };
}

/** Where-clause: edition-language audio (dub) or subtitles confirmed on an active offer. */
export function langWhere(e: Edition, kind: "audio" | "subtitle"): Prisma.TitleWhereInput {
  return {
    offers: {
      some: {
        countryCode: e.country,
        isActive: true,
        languages: { some: { lang: e.contentLang, kind, status: "confirmed_yes" } },
      },
    },
  };
}

export async function getServices(e: Edition) {
  const rows = await db.service.findMany({
    where: { slug: { in: e.coreServices }, countries: { some: { countryCode: e.country } } },
    include: { countries: { where: { countryCode: e.country } } },
  });
  // Keep the edition's editorial order.
  return e.coreServices
    .map((slug) => rows.find((r) => r.slug === slug))
    .filter((r): r is (typeof rows)[number] => !!r)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      logoPath: r.logoPath,
      priceFrom: r.countries[0]?.priceFrom ? Number(r.countries[0].priceFrom) : null,
      currency: r.countries[0]?.currency ?? null,
      hasAdsTier: r.countries[0]?.hasAdsTier ?? false,
    }));
}

export async function getPublishedLists(e: Edition, take?: number) {
  return db.list.findMany({
    where: { lang: e.contentLang, countryCode: e.country, isPublished: true },
    include: {
      items: { orderBy: { position: "asc" }, take: 4, include: { title: { select: { posterPath: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { id: "asc" },
    take,
  });
}
