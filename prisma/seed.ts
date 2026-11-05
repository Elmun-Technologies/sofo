/**
 * Sample data for local development — NOT real availability.
 * Posters come from design/assets (copied to public/sample). Real data arrives via ingest (04).
 * Idempotent: wipes catalog/availability tables, then inserts.
 */
import { LangStatus, OfferType, PrismaClient, TitleType } from "@prisma/client";
import { slugify } from "../lib/slug";

const db = new PrismaClient();

type SeedTitle = {
  tmdbId: number;
  type: TitleType;
  original: string;
  lang: string;
  year: number;
  trName: string;
  /** English name when the original title is not Latin */
  enName?: string;
  overview?: string;
  genres: string[];
  runtime?: number;
  score: number;
  poster?: boolean;
  backdrop?: string;
  kids?: boolean;
  /** Service slugs carrying the title in TR */
  on: string[];
};

const anim = ["Animation"];

const TITLES: SeedTitle[] = [
  { tmdbId: 1184918, type: "movie", original: "The Wild Robot", lang: "en", year: 2024, trName: "Vahşi Robot", overview: "Issız bir adaya düşen robot Roz, yetim bir kaz yavrusuna annelik etmeyi öğrenir.", genres: anim, runtime: 102, score: 8.3, poster: true, backdrop: "bd-robot.jpg", kids: true, on: ["netflix", "prime-video"] },
  { tmdbId: 94605, type: "tv", original: "Arcane", lang: "en", year: 2021, trName: "Arcane", overview: "Piltover ve Zaun arasında bölünmüş iki kız kardeşin hikâyesi.", genres: [...anim, "Drama"], score: 8.7, poster: true, backdrop: "bd-arcane.jpg", on: ["netflix"] },
  { tmdbId: 1022789, type: "movie", original: "Inside Out 2", lang: "en", year: 2024, trName: "Ters Yüz 2", overview: "Riley ergenliğe girerken zihin merkezine yeni duygular taşınır.", genres: anim, runtime: 96, score: 7.6, poster: true, backdrop: "bd-insideout.jpg", kids: true, on: ["disney-plus"] },
  { tmdbId: 85937, type: "tv", original: "Demon Slayer: Kimetsu no Yaiba", lang: "ja", year: 2019, trName: "Demon Slayer: Kimetsu no Yaiba", overview: "Ailesi iblislerce katledilen Tanjiro, iblise dönüşen kız kardeşini kurtarmak için yola çıkar.", genres: [...anim, "Action"], score: 8.5, poster: true, backdrop: "bd-demon.jpg", on: ["netflix", "exxen"] },
  { tmdbId: 1241982, type: "movie", original: "Moana 2", lang: "en", year: 2024, trName: "Moana 2", overview: "Moana, atalarından gelen bir çağrıyla Okyanusya'nın uzak sularına açılır.", genres: anim, runtime: 100, score: 7.0, poster: true, kids: true, on: ["disney-plus"] },
  { tmdbId: 1011985, type: "movie", original: "Kung Fu Panda 4", lang: "en", year: 2024, trName: "Kung Fu Panda 4", overview: "Po, Ejder Savaşçısı unvanını devredecek birini ararken yeni bir kötüyle karşılaşır.", genres: anim, runtime: 94, score: 7.1, poster: true, backdrop: "bd-panda.jpg", kids: true, on: ["netflix", "prime-video"] },
  { tmdbId: 354912, type: "movie", original: "Coco", lang: "en", year: 2017, trName: "Koko", overview: "Müzisyen olmayı hayal eden Miguel, kendini Ölüler Diyarı'nda bulur.", genres: anim, runtime: 105, score: 8.2, poster: true, backdrop: "bd-coco.jpg", kids: true, on: ["disney-plus"] },
  { tmdbId: 95479, type: "tv", original: "Jujutsu Kaisen", lang: "ja", year: 2020, trName: "Jujutsu Kaisen", overview: "Yuji Itadori, lanetli bir parmağı yuttuktan sonra büyücüler dünyasına adım atar.", genres: [...anim, "Action"], score: 8.6, poster: true, on: ["netflix"] },
  { tmdbId: 129, type: "movie", original: "千と千尋の神隠し", enName: "Spirited Away", lang: "ja", year: 2001, trName: "Ruhların Kaçışı", overview: "Chihiro, ailesini kurtarmak için ruhların yıkandığı gizemli bir hamamda çalışmak zorunda kalır.", genres: anim, runtime: 125, score: 8.5, poster: true, backdrop: "bd-spirited.jpg", kids: true, on: ["netflix"] },
  { tmdbId: 568124, type: "movie", original: "Encanto", lang: "en", year: 2021, trName: "Encanto", overview: "Büyülü Madrigal ailesinin tek sıradan üyesi Mirabel, evlerini kurtarmaya çalışır.", genres: anim, runtime: 102, score: 7.6, poster: true, backdrop: "bd-encanto.jpg", kids: true, on: ["disney-plus"] },
  { tmdbId: 1429, type: "tv", original: "進撃の巨人", enName: "Attack on Titan", lang: "ja", year: 2013, trName: "Attack on Titan", overview: "İnsanlık, devlerden korunmak için yükselen surların ardında yaşamaktadır.", genres: [...anim, "Action"], score: 8.7, poster: true, on: ["netflix", "gain"] },
  { tmdbId: 502356, type: "movie", original: "The Super Mario Bros. Movie", lang: "en", year: 2023, trName: "Süper Mario Kardeşler Filmi", overview: "Brooklynli tesisatçı Mario, kardeşi Luigi'yi kurtarmak için Mantar Krallığı'na düşer.", genres: anim, runtime: 92, score: 7.6, poster: true, kids: true, on: ["netflix", "tod"] },
  { tmdbId: 569094, type: "movie", original: "Spider-Man: Across the Spider-Verse", lang: "en", year: 2023, trName: "Örümcek-Adam: Örümcek-Evrenine Geçiş", overview: "Miles Morales, çoklu evrende Örümcek İnsanlar topluluğuyla karşı karşıya gelir.", genres: [...anim, "Action"], runtime: 140, score: 8.3, poster: true, backdrop: "bd-spider.jpg", on: ["netflix", "prime-video"] },
  { tmdbId: 976573, type: "movie", original: "Elemental", lang: "en", year: 2023, trName: "Elementler", overview: "Ateş, su, toprak ve havanın birlikte yaşadığı bir şehirde Ember ile Wade'in yolları kesişir.", genres: anim, runtime: 101, score: 7.6, poster: true, kids: true, on: ["disney-plus"] },
  { tmdbId: 508442, type: "movie", original: "Soul", lang: "en", year: 2020, trName: "Soul", overview: "Caz tutkunu müzik öğretmeni Joe, büyük fırsatının arifesinde bedeninden ayrılır.", genres: anim, runtime: 100, score: 8.0, poster: true, on: ["disney-plus"] },
  { tmdbId: 508943, type: "movie", original: "Luca", lang: "en", year: 2021, trName: "Luca", overview: "İtalyan Rivierası'nda deniz canavarı Luca, insanlar arasında unutulmaz bir yaz geçirir.", genres: anim, runtime: 95, score: 7.8, poster: true, kids: true, on: ["disney-plus"] },
  { tmdbId: 37854, type: "tv", original: "ワンピース", enName: "One Piece", lang: "ja", year: 1999, trName: "One Piece", overview: "Monkey D. Luffy ve tayfası efsanevi hazine One Piece'in peşine düşer.", genres: [...anim, "Action"], score: 8.7, poster: true, on: ["netflix"] },
  { tmdbId: 60625, type: "tv", original: "Rick and Morty", lang: "en", year: 2013, trName: "Rick and Morty", overview: "Dâhi ve sorumsuz bilim insanı Rick, torunu Morty'yi boyutlar arası maceralara sürükler.", genres: [...anim, "Comedy"], score: 8.7, poster: true, on: ["prime-video", "hbo-max"] },
  { tmdbId: 456, type: "tv", original: "The Simpsons", lang: "en", year: 1989, trName: "Simpsonlar", overview: "Springfield'da yaşayan Simpson ailesinin gündelik hayatı.", genres: [...anim, "Comedy"], score: 8.0, poster: true, on: ["disney-plus"] },
  { tmdbId: 246, type: "tv", original: "Avatar: The Last Airbender", lang: "en", year: 2005, trName: "Avatar: Son Hava Bükücü", overview: "Aang, dört ulusu yeniden dengeye kavuşturmak için elementleri ustalaşmaya çalışır.", genres: anim, score: 8.7, poster: true, kids: true, on: ["netflix", "tabii"] },
  // No poster (and partly no overview / offers) — exercises the quality gate.
  { tmdbId: 1396, type: "tv", original: "Breaking Bad", lang: "en", year: 2008, trName: "Breaking Bad", overview: "Kanser teşhisi konan kimya öğretmeni Walter White, uyuşturucu dünyasına girer.", genres: ["Drama", "Crime"], score: 8.9, on: ["netflix"] },
  { tmdbId: 66732, type: "tv", original: "Stranger Things", lang: "en", year: 2016, trName: "Stranger Things", genres: ["Drama", "Sci-Fi"], score: 8.6, on: ["netflix"] },
  { tmdbId: 119051, type: "tv", original: "Wednesday", lang: "en", year: 2022, trName: "Wednesday", genres: ["Comedy", "Mystery"], score: 8.4, on: ["netflix"] },
  { tmdbId: 71446, type: "tv", original: "La casa de papel", lang: "es", year: 2017, trName: "La Casa de Papel", genres: ["Crime", "Drama"], score: 8.2, on: ["netflix"] },
  { tmdbId: 93405, type: "tv", original: "오징어 게임", enName: "Squid Game", lang: "ko", year: 2021, trName: "Squid Game", genres: ["Drama", "Thriller"], score: 7.8, on: ["netflix"] },
  { tmdbId: 27205, type: "movie", original: "Inception", lang: "en", year: 2010, trName: "Başlangıç", genres: ["Action", "Sci-Fi"], runtime: 148, score: 8.4, on: ["prime-video", "hbo-max"] },
  { tmdbId: 157336, type: "movie", original: "Interstellar", lang: "en", year: 2014, trName: "Yıldızlararası", genres: ["Adventure", "Sci-Fi"], runtime: 169, score: 8.5, on: ["prime-video"] },
  { tmdbId: 693134, type: "movie", original: "Dune: Part Two", lang: "en", year: 2024, trName: "Dune: Çöl Gezegeni Bölüm İki", genres: ["Sci-Fi", "Adventure"], runtime: 167, score: 8.1, on: ["hbo-max", "tod"] },
  { tmdbId: 920, type: "movie", original: "Cars", lang: "en", year: 2006, trName: "Arabalar", genres: anim, runtime: 117, score: 7.1, kids: true, on: [] },
  { tmdbId: 862, type: "movie", original: "Toy Story", lang: "en", year: 1995, trName: "Oyuncak Hikayesi", genres: anim, runtime: 81, score: 8.0, kids: true, on: [] },
];

const SERVICES = [
  { slug: "netflix", name: "Netflix", logo: "/sample/lg-netflix.png", url: "https://www.netflix.com/tr/", price: 149.99, ads: false },
  { slug: "prime-video", name: "Prime Video", logo: "/sample/lg-prime.png", url: "https://www.primevideo.com/", price: 69.9, ads: false },
  { slug: "disney-plus", name: "Disney+", logo: "/sample/lg-disney.png", url: "https://www.disneyplus.com/tr-tr", price: 134.99, ads: false },
  { slug: "hbo-max", name: "HBO Max", logo: null, url: "https://www.hbomax.com/tr/tr", price: 149.9, ads: false },
  { slug: "tod", name: "TOD", logo: null, url: "https://www.tod.tv/", price: 199, ads: false },
  { slug: "tabii", name: "tabii", logo: null, url: "https://www.tabii.com/", price: 0, ads: true },
  { slug: "exxen", name: "Exxen", logo: null, url: "https://www.exxen.com/", price: 99.9, ads: true },
  { slug: "gain", name: "Gain", logo: null, url: "https://www.gain.tv/", price: 89.9, ads: false },
] as const;

const STATUSES: LangStatus[] = ["confirmed_yes", "confirmed_yes", "confirmed_no", "unknown"];
const HOUR = 3_600_000;

async function wipe() {
  // Children first; users/lists untouched by design but cleared for a clean local DB.
  await db.availabilityEvent.deleteMany();
  await db.offerLanguage.deleteMany();
  await db.offer.deleteMany();
  await db.titleLocalization.deleteMany();
  await db.title.deleteMany();
  await db.serviceCountry.deleteMany();
  await db.service.deleteMany();
  await db.country.deleteMany();
}

async function main() {
  await wipe();
  const now = Date.now();

  await db.country.create({ data: { code: "TR", name: "Türkiye", uiLangs: ["tr", "en"] } });

  const serviceIds = new Map<string, number>();
  for (const s of SERVICES) {
    const row = await db.service.create({
      data: {
        slug: s.slug,
        name: s.name,
        logoPath: s.logo,
        countries: {
          create: { countryCode: "TR", priceFrom: s.price, currency: "TRY", hasAdsTier: s.ads },
        },
      },
    });
    serviceIds.set(s.slug, row.id);
  }

  let offerCount = 0;
  for (const [i, t] of TITLES.entries()) {
    const title = await db.title.create({
      data: {
        tmdbId: t.tmdbId,
        type: t.type,
        originalTitle: t.original,
        originalLang: t.lang,
        year: t.year,
        runtimeMin: t.runtime,
        tmdbScore: t.score,
        popularity: 100 - i,
        posterPath: t.poster ? `/sample/p${t.tmdbId}.jpg` : null,
        backdropPath: t.backdrop ? `/sample/${t.backdrop}` : null,
        genres: t.genres,
        isAnimation: t.genres.includes("Animation"),
        isKids: t.kids ?? false,
        localizations: {
          create: [
            { lang: "tr", name: t.trName, altNames: t.trName === t.original ? [] : [t.original], overview: t.overview, slug: slugify(t.trName) },
            { lang: "en", name: t.enName ?? t.original, altNames: [], slug: slugify(t.enName ?? t.original) },
          ],
        },
      },
    });

    for (const [j, slug] of t.on.entries()) {
      const service = SERVICES.find((s) => s.slug === slug)!;
      const serviceId = serviceIds.get(slug)!;
      const k = i + j;
      // Mostly subscription; Prime also sells/rents; tabii is free with ads.
      const types: OfferType[] =
        slug === "tabii" ? ["ads"] : slug === "prime-video" && k % 2 === 0 ? ["rent", "buy"] : ["subscription"];
      // One title is deliberately stale (> 7 days) to fail the quality gate.
      const checkedAt = new Date(now - (i === 21 ? 9 * 24 * HOUR : ((k * 7) % 40) * HOUR));

      for (const type of types) {
        const offer = await db.offer.create({
          data: {
            titleId: title.id,
            countryCode: "TR",
            serviceId,
            type,
            quality: k % 3 === 0 ? "uhd" : "hd",
            price: type === "rent" ? 49.9 : type === "buy" ? 129.9 : null,
            currency: type === "rent" || type === "buy" ? "TRY" : null,
            url: service.url,
            leavingAt: k % 9 === 4 ? new Date(now + 14 * 24 * HOUR) : null,
            source: "manual",
            checkedAt,
            languages: {
              create: [
                { lang: "tr", kind: "audio", status: STATUSES[k % 4]! },
                { lang: "tr", kind: "subtitle", status: k % 5 === 0 ? "unknown" : "confirmed_yes" },
                { lang: t.lang, kind: "audio", status: "confirmed_yes" },
                ...(t.lang === "en" ? [] : [{ lang: "en", kind: "subtitle" as const, status: STATUSES[(k + 1) % 4]! }]),
              ],
            },
          },
        });
        await db.availabilityEvent.create({
          data: {
            titleId: title.id,
            countryCode: "TR",
            serviceId,
            type: "added",
            offerType: type,
            after: { offerId: offer.id, quality: offer.quality },
            occurredAt: new Date(now - (30 + k) * 24 * HOUR),
          },
        });
        offerCount++;
      }
    }
  }

  console.log(`Seeded: 1 country, ${SERVICES.length} services, ${TITLES.length} titles, ${offerCount} offers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
