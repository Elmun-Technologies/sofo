import { availableWhere, getCards, getCardsByIds, getPublishedLists, langWhere, type TitleCard } from "../catalog";
import { db } from "../db";
import type { Edition } from "../editions";

const DAY = 86_400_000;

export async function getHomeData(e: Edition) {
  const now = new Date();
  const since = new Date(now.getTime() - 14 * DAY);

  const [top, dubEvents, newEvents, leavingOffer, anime, kids, lists, dubCount, subCount, trending] = await Promise.all([
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
    db.offer.findFirst({
      where: { countryCode: e.country, isActive: true, seasonId: null, leavingAt: { gte: now } },
      orderBy: { leavingAt: "asc" },
      include: { service: true, title: { include: { localizations: { where: { lang: e.contentLang } } } } },
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

  const uniq = (ids: number[]) => [...new Set(ids)];
  const [justDubbed, newThisWeek] = await Promise.all([
    // Edition-language dubs only (JSON `after.lang`; filtered here — SQLite has no JSON path filter in Prisma).
    getCardsByIds(e, uniq(dubEvents.filter((d) => (d.after as { lang?: string } | null)?.lang === e.contentLang).map((d) => d.titleId)).slice(0, 12)),
    getCardsByIds(e, uniq(newEvents.map((d) => d.titleId)).slice(0, 12)),
  ]);

  const dubCards = await getCards(e, langWhere(e, "audio"), { take: 3 });
  const subCards = await getCards(e, langWhere(e, "subtitle"), { take: 3, skip: 3 });
  const animeCards = anime.slice(0, 3);
  const kidsCards = kids.slice(0, 3);

  const leaving = leavingOffer?.leavingAt && leavingOffer.title.localizations[0]
    ? {
        titleId: leavingOffer.title.id,
        type: leavingOffer.title.type,
        slug: leavingOffer.title.localizations[0].slug,
        name: leavingOffer.title.localizations[0].name,
        posterPath: leavingOffer.title.posterPath,
        year: leavingOffer.title.year,
        service: leavingOffer.service.name,
        leavingAt: leavingOffer.leavingAt,
      }
    : null;

  return {
    top,
    justDubbed,
    newThisWeek,
    leaving,
    anime,
    kids,
    lists,
    trending: trending.map((t) => t.query),
    langCards: [
      { key: "dub", count: dubCount, cards: dubCards },
      { key: "sub", count: subCount, cards: subCards },
      { key: "anime", count: anime.length, cards: animeCards },
      { key: "kids", count: kids.length, cards: kidsCards },
    ] satisfies { key: string; count: number; cards: TitleCard[] }[],
  };
}
