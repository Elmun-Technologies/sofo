import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryTiles, type CategoryTile } from "@/components/home/category-tiles";
import { DarkShelf } from "@/components/home/dark-shelf";
import { Advantages, FeatureBento, type Feature } from "@/components/home/feature-bento";
import { LeavingCard } from "@/components/home/leaving-card";
import { MyServices } from "@/components/home/my-services";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { ArrowRightIcon, CalendarIcon, CaptionsIcon, ClockIcon, HeartIcon, LayersIcon, ShieldCheckIcon, TelegramIcon, VolumeIcon } from "@/components/icons";
import { CollectionCard } from "@/components/catalog/collection-card";
import { PromoSlider, type PromoSlide } from "@/components/home/promo-slider";
import { DubBadge } from "@/components/ui/badges";
import { ServiceLogo } from "@/components/ui/service-logo";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterRow } from "@/components/ui/poster-row";
import { SectionHeader } from "@/components/ui/section-header";
import { getServices } from "@/lib/catalog";
import { getEdition, paths } from "@/lib/editions";
import { formatPrice, formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getHomeData } from "@/lib/queries/home";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const ACCENT: Record<string, string> = { dub: "bg-dub", sub: "bg-text-2", anime: "bg-free", kids: "bg-available" };

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const home = edition.routes.home;
  return {
    title: { absolute: `Türkçe dublaj filmler ve diziler hangi platformda? · sofo ${edition.countryName}` },
    description: `Netflix, Disney+, Prime Video, HBO Max ve diğer yasal platformlarda hangi film ve dizinin Türkçe dublaj ya da altyazıyla olduğunu her gün kontrol ediyoruz.`,
    alternates: buildAlternates(home, { [edition.hreflang]: home }),
  };
}

export default async function EditionHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const [data, services] = await Promise.all([getHomeData(edition), getServices(edition)]);
  const r = edition.routes;

  const langCards = data.langCards.map((c) => ({
    ...c,
    ...{
      dub: { name: dubTerm(edition.contentLang), sub: "Dubbed on legal services", href: r.dubHub, local: true },
      sub: { name: subTerm(edition.contentLang), sub: "Original audio + subtitles", href: r.subHub, local: true },
      anime: { name: "Anime — sub or dub", sub: "Japanese & Korean animation", href: r.anime, local: false },
      kids: { name: "Kids, dubbed", sub: "Safe picks for children", href: r.kids, local: false },
    }[c.key as "dub" | "sub" | "anime" | "kids"],
  }));

  const slides: PromoSlide[] = data.spotlight.map(({ card: c, overview, runtimeMin }) => ({
    id: c.id,
    type: c.type,
    slug: c.slug,
    href: paths.title(edition, c.type, c.slug),
    name: c.name,
    year: c.year,
    posterPath: c.posterPath,
    backdrop: imageUrl(c.backdropPath, "w1280")!,
    overview,
    meta: [c.type === "movie" ? "Movie" : "Series", c.year ? String(c.year) : null, c.type === "movie" ? formatRuntime(runtimeMin) : null, c.genres.slice(0, 2).join(", ") || null].filter(
      (m): m is string => !!m,
    ),
    score: c.score,
    services: c.services,
    langLabel: c.dub ? dubTerm(edition.contentLang) : c.sub ? subTerm(edition.contentLang) : null,
    langKind: c.dub ? "dub" : c.sub ? "sub" : null,
    free: c.hasFree,
  }));
  const cap = (t: string) => t.replace(/^./, (c) => c.toLocaleUpperCase(edition.hreflang));

  const tiles: CategoryTile[] = [
    { href: r.movies, label: "Movies", count: data.typeCards[0]?.count, cards: data.typeCards[0]?.cards ?? [] },
    { href: r.series, label: "Series", count: data.typeCards[1]?.count, cards: data.typeCards[1]?.cards ?? [] },
    ...langCards.map((c) => ({ href: c.href, label: c.local ? cap(c.name) : c.name.replace(/ —.*$/, ""), count: c.count, cards: c.cards, lang: c.local ? edition.hreflang : undefined, dot: ACCENT[c.key] })),
    { href: r.newLeaving, label: "New & leaving", cards: data.newThisWeek.slice(0, 3), dot: "bg-red-500" },
    { href: r.releases, label: "Coming to digital", cards: data.justDubbed.slice(3, 6).length ? data.justDubbed.slice(3, 6) : data.top.slice(6, 9) },
    { href: r.trailers, label: "Trailers", cards: data.top.slice(3, 6) },
  ];

  const features: Feature[] = [
    {
      href: r.dubHub,
      title: `${cap(dubTerm(edition.contentLang))} guide`,
      text: "Movies and series with a Turkish dub confirmed by the service",
      icon: <VolumeIcon className="size-12 text-dub" />,
      tone: "bg-dub/12",
      lang: edition.hreflang,
    },
    { href: `${r.myList}#alerts`, title: "Telegram alerts", text: "We message you when a title gets a dub or is about to leave", icon: <TelegramIcon className="size-12 text-[#229ED9]" />, tone: "bg-[#229ED9]/12" },
    { href: r.releases, title: "Coming to digital", text: "Cinema releases and when they reach a service", icon: <CalendarIcon className="size-12 text-free" />, tone: "bg-free/12" },
    { href: r.about, title: "How we check", text: "Only legal services, re-checked every day — never guessed", icon: <ShieldCheckIcon className="size-12 text-available" />, tone: "bg-available/12" },
  ];

  return (
    <>
      <h1 className="sr-only">
        Where to watch movies and series in {edition.countryName} — with <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>
      </h1>

      {/* Hero: campaign slider + "Last chance" countdown (santehnika "Товары дня") */}
      <section className="wrap pt-4 md:pt-6">
        <div className={`grid gap-3 md:gap-4 ${data.leaving ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
          <div className="min-w-0">{slides.length > 1 ? <PromoSlider slides={slides} localLang={edition.hreflang} contained /> : null}</div>
          {data.leaving ? (
            <div className="hidden lg:block">
              <LeavingCard
                items={data.leavingList.map((l) => ({
                  href: paths.title(edition, l.type, l.slug),
                  name: l.name,
                  service: l.service,
                  posterPath: l.posterPath,
                  leavingAt: l.leavingAt.toISOString(),
                  year: l.year,
                }))}
                listHref={r.newLeaving}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="wrap pt-6 md:pt-8" aria-label="Categories">
        <CategoryTiles tiles={tiles} allHref={r.movies} />
      </section>

      <DarkShelf
        title={`Top 10 in ${edition.countryName}`}
        sub="The most watched on legal services, with language info on every title."
        cta="Open the catalogue"
        href={r.movies}
        cards={data.top}
        edition={edition}
        ranked
      />

      {/* Platforms — santehnika "original brands" strip */}
      <section className="wrap pb-2" aria-labelledby="by-service">
        <SectionHeader id="by-service" title={`Platforms in ${edition.countryName}`} href={r.movies} linkLabel="All titles" />
        <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:px-0">
          {services.map((s) => (
            <li key={s.slug} className="shrink-0">
              <Link href={paths.service(edition, s.slug)} className="flex h-[68px] w-[210px] items-center gap-3 rounded-card bg-surface px-4 transition-colors hover:bg-surface-2 hover:text-text md:w-auto">
                <ServiceLogo {...s} size={38} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-extrabold">{s.name}</span>
                  <span className="tnum block text-xs text-text-3">{s.priceFrom ? `from ${formatPrice(s.priceFrom, s.currency)}/mo` : s.hasAdsTier ? "Free with ads" : "Subscription"}</span>
                </span>
                <ArrowRightIcon className="ml-auto size-4 shrink-0 text-text-3" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PosterRow
        title={`Just dubbed into ${langName(edition.contentLang)}`}
        sub="Dub tracks confirmed in the last two weeks"
        cards={data.justDubbed}
        edition={edition}
        href={r.newLeaving}
        badge={() => "new-dub"}
      />

      <section className="wrap section-y">
        <FeatureBento items={features} />
      </section>

      <PosterRow title="New this week" sub={`Just added to services in ${edition.countryName}`} cards={data.newThisWeek} edition={edition} href={r.newLeaving} />
      <PosterRow
        title="Anime — sub or dub"
        cards={data.anime}
        edition={edition}
        href={r.anime}
        badge={(c) => (c.dub ? <DubBadge>{edition.contentLang.toUpperCase()} dub</DubBadge> : c.sub ? undefined : "none")}
      />

      <MyServices services={services} />

      <PosterRow title={`For kids — in ${langName(edition.contentLang)}`} cards={data.kids} edition={edition} href={r.kids} />

      {data.lists.length ? (
        <section className="wrap section-y scroll-mt-24" id="collections">
          <SectionHeader title="Collections" sub="Hand-picked by sofo editors" href={r.collections} linkLabel="All collections" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {data.lists.map((l) => (
              <li key={l.id}>
                <CollectionCard edition={edition} list={l} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="wrap section-y">
        <SectionHeader title="Why sofo" />
        <Advantages
          items={[
            { title: "Only legal services", text: "No piracy, no mirrors — every link opens the official service.", icon: <ShieldCheckIcon className="size-6" /> },
            { title: "Checked every day", text: "Each offer shows when we last checked it.", icon: <ClockIcon className="size-6" /> },
            { title: "Language confirmed", text: "Dub and subtitles only when the service confirms them.", icon: <CaptionsIcon className="size-6" /> },
            { title: "All platforms, one search", text: `Netflix, Prime Video, Disney+ and more in ${edition.countryName}.`, icon: <LayersIcon className="size-6" /> },
            { title: "Free, no sign-up", text: "Save titles on this device and get alerts on Telegram.", icon: <HeartIcon className="size-6" /> },
          ]}
        />
      </section>

      <SubscribeSection langName={langName(edition.contentLang)} />

      <section className="wrap section-y" lang={edition.hreflang}>
        <div className="max-w-3xl">
          <h2 className="text-h3">Türkçe dublaj filmler ve diziler — hangi platformda?</h2>
          <details className="group mt-2 text-sm leading-relaxed text-text-2">
            <summary className="list-none">
              <span>
                sofo; Netflix, Disney+, Prime Video, HBO Max ve Crunchyroll gibi Türkiye&apos;deki yasal platformları her gün kontrol eder ve
                hangi film ve dizinin Türkçe dublaj ya da altyazıyla izlenebildiğini gösterir…
              </span>
              <span lang="en" className="mt-2 block font-bold text-orange-press group-open:hidden">
                Read more
              </span>
            </summary>
            <p className="mt-2">
              Dil bilgisi yalnızca platform onayladığında gösterilir; doğrulanmamışsa “Not confirmed by the service” yazarız ve asla tahmin etmeyiz. Her
              sonuçta son kontrol zamanı yer alır. Video barındırmayız; izleme her zaman resmi platformda gerçekleşir. Korsan sitelere bağlantı vermeyiz.
            </p>
          </details>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "sofo",
          url: new URL(r.home, siteUrl()).toString(),
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${new URL(r.search, siteUrl()).toString()}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}
