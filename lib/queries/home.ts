import { availableWhere, cardInclude, getCards, getCardsByIds, getPublishedLists, langWhere, toCard, type TitleCard } from "../catalog";
import { db } from "../db";
import type { Edition } from "../editions";

const DAY = 86_400_000;

export async function getHomeData(e: Edition) {
  const now = new Date();
  const since = new Date(now.getTime() - 14 * DAY);

  const [top, dubEvents, newEvents, leavingOffers, anime, kids, lists, dubCount, subCount, trending] = await Promise.all([
    getCards(e, availableWhere(e), { take: 10, orderBy: [{ popularity: "desc" }, { id: "asc" }] }),
    db.availabilityEvent.findMany({
      where: { countryCode: e.country, type: "audio_added", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      select: { titleId: true, after: true },
      take: 60,
    }),
    db.availabilityEvent.findMany({
      where: { countryCode: e.country, type: "added", occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      select: { titleId: true },
      take: 30,
    }),
    db.offer.findMany({
      where: { countryCode: e.country, isActive: true, seasonId: null, leavingAt: { gte: now } },
      orderBy: { leavingAt: "asc" },
      include: { service: true, title: { include: { localizations: { where: { lang: e.contentLang } } } } },
      take: 12,
    }),
    getCards(e, { ...availableWhere(e), isAnimation: true, originalLang: { in: ["ja", "ko", "zh"] } }, { take: 12 }),
    getCards(e, { ...availableWhere(e), isKids: true }, { take: 12 }),
    getPublishedLists(e, 4),
    db.title.count({ where: langWhere(e, "audio") }),
    db.title.count({ where: langWhere(e, "subtitle") }),
    db.searchStat.groupBy({
      by: ["query"],
      where: { countryCode: e.country, zeroResults: false, day: { gte: new Date(now.getTime() - 7 * DAY) } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 6,
    }),
  ]);

  // Promo slider: popular available titles that have wide key art.
  const spotlightRows = await db.title.findMany({
    where: { localizations: { some: { lang: e.contentLang } }, backdropPath: { not: null }, ...availableWhere(e) },
    include: cardInclude(e),
    orderBy: [{ popularity: "desc" }, { id: "asc" }],
    take: 7,
  });
  const spotlight = spotlightRows.flatMap((row) => {
    const card = toCard(row);
    return card ? [{ card, overview: row.localizations[0]?.overview ?? null, runtimeMin: row.runtimeMin }] : [];
  });

  const uniq = (ids: number[]) => [...new Set(ids)];
  const [justDubbed, newThisWeek] = await Promise.all([
    // Edition-language dubs only (JSON `after.lang`; filtered here — SQLite has no JSON path filter in Prisma).
    getCardsByIds(e, uniq(dubEvents.filter((d) => (d.after as { lang?: string } | null)?.lang === e.contentLang).map((d) => d.titleId)).slice(0, 12)),
    getCardsByIds(e, uniq(newEvents.map((d) => d.titleId)).slice(0, 12)),
  ]);

  const available = { offers: { some: { countryCode: e.country, isActive: true } } };
  const [movieCount, seriesCount, movieCards, seriesCards] = await Promise.all([
    db.title.count({ where: { type: "movie", ...available } }),
    db.title.count({ where: { type: "tv", ...available } }),
    getCards(e, { type: "movie", ...available }, { take: 3 }),
    getCards(e, { type: "tv", ...available }, { take: 3, skip: 2 }),
  ]);
  const dubCards = await getCards(e, langWhere(e, "audio"), { take: 3 });
  const subCards = await getCards(e, langWhere(e, "subtitle"), { take: 3, skip: 3 });
  const animeCards = anime.slice(0, 3);
  const kidsCards = kids.slice(0, 3);

  // Soonest-leaving titles, one entry per title (a title can leave several services).
  const seen = new Set<number>();
  const leavingList = leavingOffers.flatMap((o) => {
    const loc = o.title.localizations[0];
    if (!o.leavingAt || !loc || seen.has(o.title.id)) return [];
    seen.add(o.title.id);
    return [
      {
        titleId: o.title.id,
        type: o.title.type,
        slug: loc.slug,
        name: loc.name,
        posterPath: o.title.posterPath,
        year: o.title.year,
        service: o.service.name,
        leavingAt: o.leavingAt,
      },
    ];
  }).slice(0, 5);
  const leaving = leavingList[0] ?? null;

  return {
    spotlight,
    top,
    justDubbed,
    newThisWeek,
    leaving,
    leavingList,
    anime,
    kids,
    lists,
    trending: trending.map((t) => t.query),
    typeCards: [
      { key: "movie", count: movieCount, cards: movieCards },
      { key: "tv", count: seriesCount, cards: seriesCards },
    ] satisfies { key: string; count: number; cards: TitleCard[] }[],
    langCards: [
      { key: "dub", count: dubCount, cards: dubCards },
      { key: "sub", count: subCount, cards: subCards },
      { key: "anime", count: anime.length, cards: animeCards },
      { key: "kids", count: kids.length, cards: kidsCards },
    ] satisfies { key: string; count: number; cards: TitleCard[] }[],
  };
}
