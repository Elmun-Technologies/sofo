/** Read queries for /admin (dashboard, QA, lists). */
import type { EventType, Prisma, ReportKind, ReportStatus } from "@prisma/client";
import { db } from "../db";
import type { Edition } from "../editions";
import { qualityGate } from "../quality-gate";
import { getPageInventory, summarizeInventory } from "../seo/pages";

const HOUR = 3_600_000;
export const REPORT_SLA_HOURS = 24;
export const FRESH_HOURS = 48;

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  not_on_service: "Not on this service anymore",
  wrong_language: "Language info is wrong",
  wrong_price: "Price is wrong",
  broken_link: "Link doesn't open the title",
  other: "Other",
};

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export async function getDashboard(e: Edition, now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 24 * HOUR);
  const freshSince = new Date(now.getTime() - FRESH_HOURS * HOUR);
  const offerWhere = { countryCode: e.country, isActive: true } satisfies Prisma.OfferWhereInput;

  const [titles, titlesNew, offersActive, offersFresh, lastIngest, perService, eventsByType, latestEvents, openReports, topSearches, zeroSearches, inventory] =
    await Promise.all([
      db.title.count({ where: { localizations: { some: { lang: e.contentLang } } } }),
      db.title.count({ where: { localizations: { some: { lang: e.contentLang } }, createdAt: { gte: weekAgo } } }),
      db.offer.count({ where: offerWhere }),
      db.offer.count({ where: { ...offerWhere, checkedAt: { gte: freshSince } } }),
      db.offer.aggregate({ where: { countryCode: e.country }, _max: { checkedAt: true } }),
      db.offer.groupBy({ by: ["serviceId"], where: offerWhere, _count: { _all: true }, _max: { checkedAt: true }, _min: { checkedAt: true } }),
      db.availabilityEvent.groupBy({ by: ["type"], where: { countryCode: e.country, occurredAt: { gte: weekAgo } }, _count: { _all: true } }),
      db.availabilityEvent.findMany({
        where: { countryCode: e.country },
        orderBy: { occurredAt: "desc" },
        take: 8,
        include: { service: { select: { name: true } }, title: { select: { localizations: { where: { lang: e.contentLang }, select: { name: true } }, originalTitle: true } } },
      }),
      db.errorReport.findMany({ where: { status: { in: ["open", "rechecking"] } }, select: { createdAt: true } }),
      db.searchStat.groupBy({
        by: ["query"],
        where: { countryCode: e.country, day: { gte: weekAgo } },
        _sum: { count: true },
        orderBy: { _sum: { count: "desc" } },
        take: 8,
      }),
      db.searchStat.groupBy({
        by: ["query"],
        where: { countryCode: e.country, day: { gte: weekAgo }, zeroResults: true },
        _sum: { count: true },
        orderBy: { _sum: { count: "desc" } },
        take: 8,
      }),
      getPageInventory(e, now),
    ]);

  const services = await db.service.findMany({ where: { id: { in: perService.map((s) => s.serviceId) } }, select: { id: true, name: true, slug: true } });
  const fresh = await db.offer.groupBy({ by: ["serviceId"], where: { ...offerWhere, checkedAt: { gte: freshSince } }, _count: { _all: true } });
  const freshBy = new Map(fresh.map((f) => [f.serviceId, f._count._all]));

  const oldestOpen = openReports.reduce<Date | null>((m, r) => (!m || r.createdAt < m ? r.createdAt : m), null);
  const titlePages = inventory.filter((p) => p.type === "title");

  return {
    now,
    titles,
    titlesNew,
    offersActive,
    offersFreshPct: offersActive ? (offersFresh / offersActive) * 100 : null,
    lastIngestAt: lastIngest._max.checkedAt,
    services: perService
      .map((s) => ({
        name: services.find((x) => x.id === s.serviceId)?.name ?? `#${s.serviceId}`,
        offers: s._count._all,
        fresh: freshBy.get(s.serviceId) ?? 0,
        lastCheckedAt: s._max.checkedAt,
        oldestCheckedAt: s._min.checkedAt,
      }))
      .sort((a, b) => b.offers - a.offers),
    titlePages: { total: titlePages.length, index: titlePages.filter((p) => p.index).length },
    inventory: summarizeInventory(inventory),
    eventsByType: eventsByType.map((x) => ({ type: x.type as EventType, count: x._count._all })).sort((a, b) => b.count - a.count),
    latestEvents: latestEvents.map((ev) => ({
      id: String(ev.id),
      type: ev.type,
      title: ev.title.localizations[0]?.name ?? ev.title.originalTitle,
      service: ev.service.name,
      occurredAt: ev.occurredAt,
    })),
    reports: {
      open: openReports.length,
      breaches: openReports.filter((r) => now.getTime() - r.createdAt.getTime() > REPORT_SLA_HOURS * HOUR).length,
      oldestHours: oldestOpen ? (now.getTime() - oldestOpen.getTime()) / HOUR : null,
    },
    topSearches: topSearches.map((s) => ({ query: s.query, count: s._sum.count ?? 0 })),
    zeroSearches: zeroSearches.map((s) => ({ query: s.query, count: s._sum.count ?? 0 })),
  };
}

// ───────────────────────── QA ─────────────────────────

const STATUS_RANK: Record<ReportStatus, number> = { open: 0, rechecking: 1, fixed: 2, rejected: 3 };

export async function getReports(e: Edition, now = new Date()) {
  const recent = new Date(now.getTime() - 7 * 24 * HOUR);
  const rows = await db.errorReport.findMany({
    where: { OR: [{ status: { in: ["open", "rechecking"] } }, { resolvedAt: { gte: recent } }] },
    include: {
      title: { select: { id: true, type: true, posterPath: true, originalTitle: true, localizations: { where: { lang: e.contentLang }, select: { name: true, slug: true } } } },
      offer: { select: { id: true, type: true, url: true, countryCode: true, service: { select: { name: true } } } },
    },
    take: 200,
  });
  return rows
    .map((r) => {
      const ageHours = ((r.resolvedAt ?? now).getTime() - r.createdAt.getTime()) / HOUR;
      const unresolved = r.status === "open" || r.status === "rechecking";
      return {
        id: r.id,
        kind: r.kind,
        note: r.note,
        status: r.status,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        ageHours,
        breached: unresolved && ageHours > REPORT_SLA_HOURS,
        /** hours left until the SLA is breached (negative = overdue) */
        slaLeftHours: REPORT_SLA_HOURS - ageHours,
        unresolved,
        title: {
          id: r.title.id,
          type: r.title.type,
          posterPath: r.title.posterPath,
          name: r.title.localizations[0]?.name ?? r.title.originalTitle,
          slug: r.title.localizations[0]?.slug ?? null,
        },
        offer: r.offer ? { id: r.offer.id, type: r.offer.type, service: r.offer.service.name, country: r.offer.countryCode, url: r.offer.url } : null,
      };
    })
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || (a.unresolved ? a.slaLeftHours - b.slaLeftHours : b.createdAt.getTime() - a.createdAt.getTime()));
}

export type ReportRow = Awaited<ReturnType<typeof getReports>>[number];

/** Titles that fail the gate in this edition, with reasons (plus TMDB id for entity resolution). */
export async function getNoindexTitles(e: Edition, now = new Date()) {
  const rows = await db.title.findMany({
    where: { localizations: { some: { lang: e.contentLang } } },
    select: {
      id: true,
      tmdbId: true,
      type: true,
      year: true,
      posterPath: true,
      originalTitle: true,
      localizations: { where: { lang: e.contentLang }, select: { name: true, overview: true, slug: true } },
      offers: { where: { countryCode: e.country, isActive: true, seasonId: null, episodeId: null }, select: { checkedAt: true } },
    },
    orderBy: [{ popularity: { sort: "desc", nulls: "last" } }, { id: "asc" }],
  });
  return rows
    .map((t) => {
      const loc = t.localizations[0];
      const gate = qualityGate({ name: loc?.name, overview: loc?.overview, posterPath: t.posterPath, year: t.year, activeOfferCheckedAt: t.offers.map((o) => o.checkedAt) }, now);
      return { id: t.id, tmdbId: t.tmdbId, type: t.type, year: t.year, originalTitle: t.originalTitle, name: loc?.name ?? t.originalTitle, slug: loc?.slug ?? null, posterPath: t.posterPath, gate };
    })
    .filter((t) => !t.gate.index);
}

// ───────────────────────── Lists ─────────────────────────

export async function getAdminLists(e: Edition) {
  return db.list.findMany({
    where: { lang: e.contentLang, countryCode: e.country },
    include: { _count: { select: { items: true } } },
    orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getListEditor(e: Edition, id: number, now = new Date()) {
  const list = await db.list.findFirst({
    where: { id, lang: e.contentLang, countryCode: e.country },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          title: {
            select: {
              id: true,
              type: true,
              year: true,
              posterPath: true,
              originalTitle: true,
              localizations: { where: { lang: e.contentLang }, select: { name: true, overview: true, slug: true } },
              offers: {
                where: { countryCode: e.country, isActive: true, seasonId: null, episodeId: null },
                select: { checkedAt: true, serviceId: true, languages: { where: { lang: e.contentLang, kind: "audio", status: "confirmed_yes" }, select: { lang: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!list) return null;
  const items = list.items.map((i) => {
    const t = i.title;
    const loc = t.localizations[0];
    const gate = qualityGate({ name: loc?.name, overview: loc?.overview, posterPath: t.posterPath, year: t.year, activeOfferCheckedAt: t.offers.map((o) => o.checkedAt) }, now);
    return {
      titleId: t.id,
      position: i.position,
      blurb: i.blurb,
      name: loc?.name ?? t.originalTitle,
      slug: loc?.slug ?? null,
      type: t.type,
      year: t.year,
      posterPath: t.posterPath,
      services: new Set(t.offers.map((o) => o.serviceId)).size,
      dub: t.offers.some((o) => o.languages.length > 0),
      gate,
    };
  });
  return { list, items };
}

/** Simple ILIKE search on the localized name (admin only, not the public search). */
export async function searchTitlesForList(e: Edition, q: string, excludeIds: number[]) {
  const term = q.trim().slice(0, 100);
  if (term.length < 2) return [];
  const rows = await db.titleLocalization.findMany({
    where: {
      lang: e.contentLang,
      titleId: { notIn: excludeIds },
      OR: [{ name: { contains: term, mode: "insensitive" } }, { title: { originalTitle: { contains: term, mode: "insensitive" } } }],
    },
    select: { titleId: true, name: true, title: { select: { year: true, type: true, posterPath: true } } },
    take: 12,
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({ id: r.titleId, name: r.name, year: r.title.year, type: r.title.type, posterPath: r.title.posterPath }));
}
