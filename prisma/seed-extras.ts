/**
 * Sample seasons, people, videos, lists, franchises, releases, history and quality data.
 * Everything here is illustrative — not verified availability.
 */
import type { LangStatus, PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

type Ctx = { titleIds: Map<number, number>; serviceIds: Map<string, number>; now: number };

const DAY = 86_400_000;

const SEASONS: Record<number, number> = {
  94605: 2, 85937: 4, 95479: 2, 1429: 4, 37854: 1, 60625: 7, 456: 3, 246: 3,
  1396: 5, 66732: 4, 119051: 2, 71446: 5, 93405: 2,
};

const PEOPLE: { name: string; knownFor: string; credits: [number, string, string?][] }[] = [
  { name: "Chris Sanders", knownFor: "Directing", credits: [[1184918, "Director"], [1184918, "Writer"]] },
  { name: "Lupita Nyong'o", knownFor: "Acting", credits: [[1184918, "Voice", "Roz"]] },
  { name: "Kit Connor", knownFor: "Acting", credits: [[1184918, "Voice", "Brightbill"]] },
  { name: "Pedro Pascal", knownFor: "Acting", credits: [[1184918, "Voice", "Fink"]] },
  { name: "Catherine O'Hara", knownFor: "Acting", credits: [[1184918, "Voice", "Pinktail"]] },
  { name: "Bill Nighy", knownFor: "Acting", credits: [[1184918, "Voice", "Longneck"]] },
  { name: "Mark Hamill", knownFor: "Acting", credits: [[1184918, "Voice", "Thorn"]] },
  { name: "Kelsey Mann", knownFor: "Directing", credits: [[1022789, "Director"]] },
  { name: "Pete Docter", knownFor: "Directing", credits: [[150540, "Director"], [508442, "Director"]] },
  { name: "Amy Poehler", knownFor: "Acting", credits: [[1022789, "Voice", "Joy"], [150540, "Voice", "Joy"]] },
  { name: "Maya Hawke", knownFor: "Acting", credits: [[1022789, "Voice", "Anxiety"], [66732, "Actor", "Robin Buckley"]] },
  { name: "Auliʻi Cravalho", knownFor: "Acting", credits: [[277834, "Voice", "Moana"], [1241982, "Voice", "Moana"]] },
  { name: "Dwayne Johnson", knownFor: "Acting", credits: [[277834, "Voice", "Maui"], [1241982, "Voice", "Maui"]] },
  { name: "Denis Villeneuve", knownFor: "Directing", credits: [[438631, "Director"], [693134, "Director"]] },
  { name: "Timothée Chalamet", knownFor: "Acting", credits: [[438631, "Actor", "Paul Atreides"], [693134, "Actor", "Paul Atreides"]] },
  { name: "Zendaya", knownFor: "Acting", credits: [[438631, "Actor", "Chani"], [693134, "Actor", "Chani"]] },
  { name: "Christopher Nolan", knownFor: "Directing", credits: [[27205, "Director"], [157336, "Director"]] },
  { name: "Leonardo DiCaprio", knownFor: "Acting", credits: [[27205, "Actor", "Cobb"]] },
  { name: "Matthew McConaughey", knownFor: "Acting", credits: [[157336, "Actor", "Cooper"]] },
  { name: "Hailee Steinfeld", knownFor: "Acting", credits: [[94605, "Voice", "Vi"], [569094, "Voice", "Gwen Stacy"], [324857, "Voice", "Gwen Stacy"]] },
  { name: "Ella Purnell", knownFor: "Acting", credits: [[94605, "Voice", "Jinx"]] },
  { name: "Shameik Moore", knownFor: "Acting", credits: [[569094, "Voice", "Miles Morales"], [324857, "Voice", "Miles Morales"]] },
  { name: "Jenna Ortega", knownFor: "Acting", credits: [[119051, "Actor", "Wednesday Addams"]] },
  { name: "Tim Burton", knownFor: "Directing", credits: [[119051, "Director"]] },
  { name: "Millie Bobby Brown", knownFor: "Acting", credits: [[66732, "Actor", "Eleven"]] },
  { name: "Bryan Cranston", knownFor: "Acting", credits: [[1396, "Actor", "Walter White"]] },
  { name: "Hayao Miyazaki", knownFor: "Directing", credits: [[129, "Director"], [129, "Writer"]] },
  { name: "Adrian Molina", knownFor: "Directing", credits: [[354912, "Director"]] },
  { name: "Tom Hanks", knownFor: "Acting", credits: [[862, "Voice", "Woody"], [863, "Voice", "Woody"]] },
  { name: "Owen Wilson", knownFor: "Acting", credits: [[920, "Voice", "Lightning McQueen"], [49013, "Voice", "Lightning McQueen"]] },
];

/** Official YouTube trailer keys (English). Sample data — verify via TMDB /videos at ingest. */
const VIDEOS: [number, string, string][] = [
  [1184918, "67vbA5ZJdKQ", "Official Trailer"],
  [1022789, "LEjhY15eCx0", "Official Trailer"],
  [1241982, "hDZ7y8RP5HE", "Official Trailer"],
  [354912, "Ga6RYejo6Hk", "Official Trailer"],
  [568124, "CaimKeDcudo", "Official Trailer"],
  [569094, "cqGjhVJWtEg", "Official Trailer"],
  [976573, "hXzcyx9V0xw", "Official Trailer"],
  [1011985, "_inKs4eeHiI", "Official Trailer"],
  [693134, "Way9Dexny3w", "Official Trailer"],
  [157336, "zSWdZVtXT7E", "Official Trailer"],
  [27205, "YoHD9XEInc0", "Official Trailer"],
];

const FRANCHISES: { name: string; items: [number, number?][] }[] = [
  { name: "Inside Out", items: [[150540], [1022789]] },
  { name: "Moana", items: [[277834], [1241982]] },
  { name: "Spider-Verse", items: [[324857], [569094]] },
  { name: "Dune", items: [[438631], [693134]] },
  { name: "Toy Story", items: [[862], [863]] },
  { name: "Cars", items: [[920], [49013]] },
];

const LISTS: { slug: string; name: string; intro: string; items: [number, string?][] }[] = [
  {
    slug: "en-iyi-turkce-dublaj-animasyon-filmler",
    name: "En iyi Türkçe dublaj animasyon filmler",
    intro: "Çocuklarla ya da tek başına: Türkçe dublajı servis tarafından onaylanmış, şu an Türkiye'de yasal olarak izlenebilen animasyonlar.",
    items: [[1184918, "Duygusal ama komik — tüm aile için."], [1022789], [354912, "Müzik ve aile üzerine."], [568124], [976573], [1241982], [508943], [1011985]],
  },
  {
    slug: "anime-turkce-dublaj-ve-altyazi",
    name: "Anime: Türkçe dublaj mı, altyazı mı?",
    intro: "Popüler animelerin hangi platformda, hangi dilde olduğunu sezon sezon kontrol ediyoruz.",
    items: [[85937], [95479], [1429], [37854], [129, "Ghibli klasiği."]],
  },
  {
    slug: "aile-ile-izlenecek-filmler",
    name: "Aileyle izlenecek filmler",
    intro: "7 yaş ve üzeri için, Türkçe dublajlı seçenekleri öne çıkaran kısa bir liste.",
    items: [[1184918], [1241982], [568124], [508943], [502356], [1011985]],
  },
  {
    slug: "pixar-filmleri-hangi-platformda",
    name: "Pixar filmleri hangi platformda?",
    intro: "Pixar filmlerinin Türkiye'deki yasal adresleri ve dublaj durumu.",
    items: [[1022789], [150540], [354912], [976573], [508442], [508943], [862], [920]],
  },
  {
    slug: "bilim-kurgu-filmleri",
    name: "Bilim kurgu: büyük ekran klasikleri",
    intro: "Kiralık ya da abonelikte — hangisi en ucuz, hangisi Türkçe?",
    items: [[693134], [438631], [157336], [27205]],
  },
  {
    slug: "yetiskin-animasyon-dizileri",
    name: "Yetişkinler için animasyon diziler",
    intro: "Arcane'den Rick and Morty'ye: altyazı ve dublaj durumuyla.",
    items: [[94605], [60625], [456], [246]],
  },
];

export async function seedExtras(db: PrismaClient, { titleIds, serviceIds, now }: Ctx) {
  const tid = (tmdbId: number) => {
    const id = titleIds.get(tmdbId);
    if (!id) throw new Error(`Unknown sample title ${tmdbId}`);
    return id;
  };
  const sid = (slug: string) => serviceIds.get(slug)!;

  // Seasons + episodes (episodes only for the first two seasons) + season-level offers.
  for (const [tmdb, count] of Object.entries(SEASONS)) {
    const titleId = tid(Number(tmdb));
    const title = await db.title.findUniqueOrThrow({
      where: { id: titleId },
      include: { offers: { where: { seasonId: null, isActive: true }, take: 1 } },
    });
    for (let n = 1; n <= count; n++) {
      const year = (title.year ?? 2020) + (n - 1);
      const season = await db.season.create({
        data: {
          titleId,
          number: n,
          name: `Sezon ${n}`,
          airDate: new Date(Date.UTC(year, 3 + (n % 6), 10)),
          episodeCount: n <= 2 ? 8 : 10,
          tmdbScore: 7.5 + ((n * 3) % 15) / 10,
        },
      });
      if (n <= 2) {
        await db.episode.createMany({
          data: Array.from({ length: 8 }, (_, e) => ({
            seasonId: season.id,
            number: e + 1,
            name: `Bölüm ${e + 1}`,
            airDate: new Date(Date.UTC(year, 3 + (n % 6), 10 + e * 7)),
            runtimeMin: 24 + ((e * 5) % 30),
            tmdbScore: 7 + ((e * 7 + n) % 25) / 10,
          })),
        });
      }
      const base = title.offers[0];
      if (base) {
        // Newest season: Turkish dub not confirmed yet — the season-level wedge.
        const latest = n === count;
        const trAudio: LangStatus = latest ? "unknown" : n % 3 === 0 ? "confirmed_no" : "confirmed_yes";
        await db.offer.create({
          data: {
            titleId,
            seasonId: season.id,
            countryCode: "TR",
            serviceId: base.serviceId,
            type: base.type,
            quality: base.quality,
            url: base.url,
            source: "manual",
            checkedAt: base.checkedAt,
            languages: {
              create: [
                { lang: "tr", kind: "audio", status: trAudio },
                { lang: "tr", kind: "subtitle", status: "confirmed_yes" },
                { lang: title.originalLang, kind: "audio", status: "confirmed_yes" },
              ],
            },
          },
        });
      }
    }
  }

  // People (no photos) + credits.
  for (const [i, p] of PEOPLE.entries()) {
    const person = await db.person.create({
      data: { tmdbId: 900_000 + i, name: p.name, slug: slugify(p.name), knownFor: p.knownFor },
    });
    for (const [order, [tmdb, job, character]] of p.credits.entries()) {
      await db.credit.create({
        data: { titleId: tid(tmdb), personId: person.id, job, character: character ?? null, order: i * 10 + order },
      });
    }
  }

  for (const [i, [tmdb, key, name]] of VIDEOS.entries()) {
    await db.video.create({
      data: {
        titleId: tid(tmdb),
        key,
        kind: "trailer",
        name,
        lang: "en",
        durationSec: 120 + ((i * 13) % 60),
        publishedAt: new Date(now - (20 + i * 9) * DAY),
      },
    });
  }

  for (const f of FRANCHISES) {
    const franchise = await db.franchise.create({ data: { name: f.name, slug: slugify(f.name) } });
    for (const [order, [tmdb, story]] of f.items.entries()) {
      await db.franchiseItem.create({
        data: { franchiseId: franchise.id, titleId: tid(tmdb), releaseOrder: order + 1, storyOrder: story ?? order + 1 },
      });
      await db.title.update({ where: { id: tid(tmdb) }, data: { franchiseId: franchise.id } });
    }
  }

  for (const l of LISTS) {
    await db.list.create({
      data: {
        lang: "tr",
        countryCode: "TR",
        slug: l.slug,
        name: l.name,
        intro: l.intro,
        isPublished: true,
        items: { create: l.items.map(([tmdb, blurb], i) => ({ titleId: tid(tmdb), position: i + 1, blurb })) },
      },
    });
  }

  // Release tracker: past stages + upcoming estimates ("~").
  const at = (days: number) => new Date(now + days * DAY);
  const releases: [number, "theatrical" | "digital" | "subscription" | "dub", number, boolean, string?, string?][] = [
    [693134, "theatrical", -620, false],
    [693134, "digital", -560, false],
    [693134, "subscription", -480, false, "hbo-max"],
    [693134, "dub", 18, true, "hbo-max", "tr"],
    [1241982, "theatrical", -340, false],
    [1241982, "digital", -280, false],
    [1241982, "subscription", -240, false, "disney-plus"],
    [1241982, "dub", -240, false, "disney-plus", "tr"],
    [1184918, "theatrical", -400, false],
    [1184918, "digital", -330, false],
    [1184918, "subscription", 12, true, "netflix"],
    [1022789, "subscription", -300, false, "disney-plus"],
    [1022789, "dub", 9, false, "prime-video", "tr"],
    [569094, "dub", 25, true, "prime-video", "tr"],
    [976573, "subscription", 40, true, "netflix"],
  ];
  for (const [tmdb, stage, days, isEstimate, service, lang] of releases) {
    await db.releaseTrack.create({
      data: {
        titleId: tid(tmdb),
        countryCode: "TR",
        stage,
        date: at(days),
        isEstimate,
        serviceId: service ? sid(service) : null,
        lang: lang ?? null,
        source: isEstimate ? "estimate: typical window" : "service announcement",
      },
    });
  }

  // History: The Wild Robot left Netflix; a price drop; fresh dubs; recent additions.
  const robot = tid(1184918);
  const gone = await db.offer.create({
    data: {
      titleId: robot, countryCode: "TR", serviceId: sid("netflix"), type: "subscription", quality: "hd",
      url: "https://www.netflix.com/tr/", source: "manual", firstSeenAt: at(-230), checkedAt: at(-110), isActive: false,
      languages: { create: [{ lang: "tr", kind: "audio", status: "confirmed_yes" }] },
    },
  });
  await db.availabilityEvent.createMany({
    data: [
      { titleId: robot, countryCode: "TR", serviceId: sid("netflix"), type: "added", offerType: "subscription", after: { offerId: gone.id }, occurredAt: at(-230) },
      { titleId: robot, countryCode: "TR", serviceId: sid("netflix"), type: "removed", offerType: "subscription", before: { offerId: gone.id }, occurredAt: at(-110) },
      { titleId: robot, countryCode: "TR", serviceId: sid("prime-video"), type: "price_change", offerType: "rent", before: { price: 59.9 }, after: { price: 49.9 }, occurredAt: at(-4) },
    ],
  });

  const recentDubs: [number, string, number][] = [
    [1241982, "disney-plus", -2],
    [1022789, "disney-plus", -5],
    [85937, "netflix", -3],
    [94605, "netflix", -6],
  ];
  for (const [tmdb, service, days] of recentDubs) {
    await db.availabilityEvent.create({
      data: { titleId: tid(tmdb), countryCode: "TR", serviceId: sid(service), type: "audio_added", after: { lang: "tr", kind: "audio" }, occurredAt: at(days) },
    });
    await db.offerLanguage.updateMany({
      where: { kind: "audio", lang: "tr", offer: { titleId: tid(tmdb), serviceId: sid(service), seasonId: null } },
      data: { status: "confirmed_yes" },
    });
  }

  // Recently added offers (New this week).
  const fresh = await db.offer.findMany({
    where: { seasonId: null, isActive: true, title: { tmdbId: { in: [1184918, 569094, 95479, 693134, 60625, 1429] } } },
  });
  for (const [i, o] of fresh.entries()) {
    await db.offer.update({ where: { id: o.id }, data: { firstSeenAt: at(-(i % 6) - 1) } });
    // Replace the older sample "added" event so the log shows one addition per offer.
    await db.availabilityEvent.deleteMany({ where: { titleId: o.titleId, serviceId: o.serviceId, type: "added", offerType: o.type, occurredAt: { gte: at(-60) } } });
    await db.availabilityEvent.create({
      data: { titleId: o.titleId, countryCode: "TR", serviceId: o.serviceId, type: "added", offerType: o.type, after: { offerId: o.id }, occurredAt: at(-(i % 6) - 1) },
    });
  }

  // Leaving announcements for offers with leavingAt.
  const leaving = await db.offer.findMany({ where: { leavingAt: { not: null }, isActive: true } });
  for (const o of leaving) {
    await db.availabilityEvent.create({
      data: { titleId: o.titleId, countryCode: "TR", serviceId: o.serviceId, type: "leaving_announced", offerType: o.type, after: { leavingAt: o.leavingAt }, occurredAt: at(-3) },
    });
  }
  // Encanto leaving Disney+ soon (home "Leaving in N days" card).
  await db.offer.updateMany({ where: { titleId: tid(568124), serviceId: sid("disney-plus") }, data: { leavingAt: at(5) } });

  // Search stats (aggregated, no personal data).
  const queries: [string, number, boolean][] = [
    ["vahşi robot", 412, false], ["arcane türkçe dublaj", 388, false], ["ters yüz 2", 301, false],
    ["moana 2 türkçe dublaj", 270, false], ["demon slayer", 244, false], ["dune 2", 190, false],
    ["kurtlar vadisi", 160, true], ["zootropolis 2", 95, true], ["the boys", 80, true],
  ];
  for (let d = 0; d < 7; d++) {
    const day = new Date(now - d * DAY);
    day.setUTCHours(0, 0, 0, 0);
    await db.searchStat.createMany({
      data: queries.map(([query, count, zeroResults]) => ({
        day, countryCode: "TR", query, count: Math.round(count / (d + 1)), zeroResults,
      })),
    });
  }

  // "Something wrong?" queue.
  await db.errorReport.createMany({
    data: [
      { titleId: robot, kind: "wrong_language", note: "Prime'da Türkçe dublaj yok gibi görünüyor", createdAt: at(-0.3) },
      { titleId: tid(94605), kind: "not_on_service", note: "Netflix'te 2. sezon görünmüyor", status: "rechecking", createdAt: at(-0.9) },
      { titleId: tid(693134), kind: "wrong_price", createdAt: at(-1.4) },
      { titleId: tid(456), kind: "broken_link", status: "fixed", createdAt: at(-3), resolvedAt: at(-2.5) },
    ],
  });
}
