/**
 * Page inventory per edition (PRD §6, §10; data-model.md §5).
 * One entry per public URL with index/noindex + reasons. Drives sitemap.ts, the admin
 * dashboard and scripts/seo/sync-pages.ts (→ Page table).
 *
 * `buildPageInventory` is pure (unit-tested); `loadInventoryData` does the DB reads.
 */
import { db } from "../db";
import { EDITIONS, paths, type Edition } from "../editions";
import { qualityGate } from "../quality-gate";

export type PageType =
  | "home"
  | "title"
  | "season"
  | "catalog"
  | "lang_hub"
  | "list"
  | "service"
  | "new_leaving"
  | "trailers"
  | "person"
  | "kids"
  | "franchise"
  | "releases"
  | "static";

export type PageEntry = {
  path: string;
  type: PageType;
  /** Edition content language (Page.lang) */
  lang: string;
  countryCode: string;
  entityId: number | null;
  index: boolean;
  /** Empty when indexable */
  reasons: string[];
  /** Same key across editions → hreflang alternates */
  hreflangKey: string;
  lastModified: Date | null;
};

export type InventoryTitle = {
  id: number;
  tmdbId: number;
  type: "movie" | "tv";
  year: number | null;
  posterPath: string | null;
  updatedAt: Date;
  /** Localization in the edition language; titles without one have no URL in this edition */
  loc: { name: string; overview: string | null; slug: string } | null;
  /** checkedAt of active title-level offers in the edition country */
  offerCheckedAt: Date[];
  seasonNumbers: number[];
};

export type InventoryData = {
  /** Most recent offer check in the edition country (last ingest) */
  lastIngestAt: Date | null;
  services: { id: number; slug: string; activeOffers: number; lastCheckedAt: Date | null }[];
  lists: { id: number; slug: string; updatedAt: Date; items: number; availableItems: number }[];
  franchises: { id: number; slug: string; items: number; availableItems: number }[];
  titles: InventoryTitle[];
  persons: { id: number; tmdbId: number; slug: string }[];
};

export const REASON = {
  utility: "utility page (always noindex)",
  season: "season pages are noindex in MVP",
  person: "person pages are noindex in MVP",
  noOffers: "no active offers in edition country",
  noItems: "no items available in edition country",
} as const;

const maxDate = (dates: (Date | null | undefined)[]): Date | null =>
  dates.reduce<Date | null>((m, d) => (d && (!m || d > m) ? d : m), null);

/** Pure: turns loaded data into the edition's page list. */
export function buildPageInventory(e: Edition, data: InventoryData, now = new Date()): PageEntry[] {
  const base = { lang: e.contentLang, countryCode: e.country };
  const out: PageEntry[] = [];
  const add = (p: Omit<PageEntry, "lang" | "countryCode" | "index"> & { index?: boolean }) =>
    out.push({ ...base, ...p, index: p.index ?? p.reasons.length === 0 });

  const r = e.routes;
  const fresh = data.lastIngestAt;
  const statics: [string, PageType, string, Date | null, string[]][] = [
    [r.home, "home", "home", fresh, []],
    [r.movies, "catalog", "catalog:movies", fresh, []],
    [r.series, "catalog", "catalog:series", fresh, []],
    [r.anime, "catalog", "catalog:anime", fresh, []],
    [r.kids, "kids", "kids", fresh, []],
    [r.dubHub, "lang_hub", "hub:dub", fresh, []],
    [r.subHub, "lang_hub", "hub:sub", fresh, []],
    [r.newLeaving, "new_leaving", "new_leaving", fresh, []],
    [r.trailers, "trailers", "trailers", fresh, []],
    [r.releases, "releases", "releases", fresh, []],
    [r.about, "static", "about", null, []],
    [r.privacy, "static", "privacy", null, []],
    [r.search, "static", "search", null, [REASON.utility]],
    [r.myList, "static", "my_list", null, [REASON.utility]],
  ];
  for (const [path, type, hreflangKey, lastModified, reasons] of statics) {
    add({ path, type, hreflangKey, entityId: null, lastModified, reasons });
  }

  for (const s of data.services) {
    if (!e.coreServices.includes(s.slug)) continue;
    add({
      path: paths.service(e, s.slug),
      type: "service",
      hreflangKey: `service:${s.slug}`,
      entityId: s.id,
      lastModified: s.lastCheckedAt,
      reasons: s.activeOffers > 0 ? [] : [REASON.noOffers],
    });
  }

  for (const l of data.lists) {
    add({
      path: paths.list(e, l.slug),
      type: "list",
      hreflangKey: `list:${l.id}`,
      entityId: l.id,
      lastModified: maxDate([l.updatedAt, fresh]),
      reasons: l.availableItems > 0 ? [] : [REASON.noItems],
    });
  }

  for (const f of data.franchises) {
    add({
      path: paths.franchise(e, f.slug),
      type: "franchise",
      hreflangKey: `franchise:${f.id}`,
      entityId: f.id,
      lastModified: fresh,
      reasons: f.availableItems > 0 ? [] : [REASON.noItems],
    });
  }

  for (const t of data.titles) {
    if (!t.loc) continue;
    const gate = qualityGate(
      { name: t.loc.name, overview: t.loc.overview, posterPath: t.posterPath, year: t.year, activeOfferCheckedAt: t.offerCheckedAt },
      now,
    );
    add({
      path: paths.title(e, t.type, t.loc.slug),
      type: "title",
      hreflangKey: `title:${t.type}:${t.tmdbId}`,
      entityId: t.id,
      lastModified: maxDate([t.updatedAt, ...t.offerCheckedAt]),
      reasons: gate.reasons,
      index: gate.index,
    });
    if (t.type === "tv") {
      for (const n of t.seasonNumbers) {
        add({
          path: paths.season(e, t.loc.slug, n),
          type: "season",
          hreflangKey: `season:${t.tmdbId}:${n}`,
          entityId: t.id,
          lastModified: null,
          reasons: [REASON.season],
        });
      }
    }
  }

  for (const p of data.persons) {
    add({ path: paths.person(e, p.slug), type: "person", hreflangKey: `person:${p.tmdbId}`, entityId: p.id, lastModified: null, reasons: [REASON.person] });
  }

  // Duplicate paths would break the Page.path unique key — keep the first (static routes win).
  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.path) ? false : (seen.add(p.path), true)));
}

export type InventorySummary = {
  total: number;
  index: number;
  noindex: number;
  byType: Record<string, { index: number; noindex: number }>;
  /** reason → number of pages (a page can have several reasons) */
  reasons: Record<string, number>;
};

/** Pure: counts for dashboards. */
export function summarizeInventory(entries: PageEntry[]): InventorySummary {
  const s: InventorySummary = { total: entries.length, index: 0, noindex: 0, byType: {}, reasons: {} };
  for (const p of entries) {
    const t = (s.byType[p.type] ??= { index: 0, noindex: 0 });
    if (p.index) {
      s.index++;
      t.index++;
    } else {
      s.noindex++;
      t.noindex++;
      for (const r of p.reasons) s.reasons[r] = (s.reasons[r] ?? 0) + 1;
    }
  }
  return s;
}

// ───────────────────────── DB ─────────────────────────

export async function loadInventoryData(e: Edition): Promise<InventoryData> {
  const activeTitleOffer = { countryCode: e.country, isActive: true, seasonId: null, episodeId: null };
  const [titles, offerStats, services, lists, franchises, persons] = await Promise.all([
    db.title.findMany({
      select: {
        id: true,
        tmdbId: true,
        type: true,
        year: true,
        posterPath: true,
        updatedAt: true,
        localizations: { where: { lang: e.contentLang }, select: { name: true, overview: true, slug: true } },
        offers: { where: activeTitleOffer, select: { checkedAt: true } },
        seasons: { select: { number: true }, orderBy: { number: "asc" } },
      },
      orderBy: { id: "asc" },
    }),
    db.offer.groupBy({
      by: ["serviceId"],
      where: { countryCode: e.country, isActive: true },
      _count: { _all: true },
      _max: { checkedAt: true },
    }),
    db.service.findMany({ where: { slug: { in: e.coreServices }, countries: { some: { countryCode: e.country } } }, select: { id: true, slug: true } }),
    db.list.findMany({
      where: { lang: e.contentLang, countryCode: e.country, isPublished: true },
      select: { id: true, slug: true, updatedAt: true, items: { select: { title: { select: { offers: { where: activeTitleOffer, select: { id: true }, take: 1 } } } } } },
    }),
    db.franchise.findMany({
      select: { id: true, slug: true, items: { select: { title: { select: { offers: { where: activeTitleOffer, select: { id: true }, take: 1 } } } } } },
    }),
    db.person.findMany({
      where: { credits: { some: { title: { localizations: { some: { lang: e.contentLang } } } } } },
      select: { id: true, tmdbId: true, slug: true },
    }),
  ]);

  const stats = new Map(offerStats.map((s) => [s.serviceId, s]));
  return {
    lastIngestAt: maxDate(offerStats.map((s) => s._max.checkedAt)),
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      activeOffers: stats.get(s.id)?._count._all ?? 0,
      lastCheckedAt: stats.get(s.id)?._max.checkedAt ?? null,
    })),
    lists: lists.map((l) => ({
      id: l.id,
      slug: l.slug,
      updatedAt: l.updatedAt,
      items: l.items.length,
      availableItems: l.items.filter((i) => i.title.offers.length > 0).length,
    })),
    franchises: franchises.map((f) => ({
      id: f.id,
      slug: f.slug,
      items: f.items.length,
      availableItems: f.items.filter((i) => i.title.offers.length > 0).length,
    })),
    titles: titles.map((t) => ({
      id: t.id,
      tmdbId: t.tmdbId,
      type: t.type,
      year: t.year,
      posterPath: t.posterPath,
      updatedAt: t.updatedAt,
      loc: t.localizations[0] ?? null,
      offerCheckedAt: t.offers.map((o) => o.checkedAt),
      seasonNumbers: t.seasons.map((s) => s.number),
    })),
    persons,
  };
}

export async function getPageInventory(e: Edition, now = new Date()): Promise<PageEntry[]> {
  return buildPageInventory(e, await loadInventoryData(e), now);
}

/** All live editions. */
export async function getAllPageInventory(now = new Date()): Promise<PageEntry[]> {
  const lists = await Promise.all(Object.values(EDITIONS).map((e) => getPageInventory(e, now)));
  return lists.flat();
}
