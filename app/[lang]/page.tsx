import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroSearch } from "@/components/home/hero-search";
import { MyServices } from "@/components/home/my-services";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { ArrowRightIcon } from "@/components/icons";
import { CollectionCard } from "@/components/catalog/collection-card";
import { PromoSlider, type PromoSlide } from "@/components/home/promo-slider";
import { DubBadge, LeavingBadge } from "@/components/ui/badges";
import { ServiceLogo } from "@/components/ui/service-logo";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { PosterRow } from "@/components/ui/poster-row";
import { SectionHeader } from "@/components/ui/section-header";
import { getServices } from "@/lib/catalog";
import { getEdition, paths } from "@/lib/editions";
import { daysUntil, formatPrice, formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName, localLangName, subTerm } from "@/lib/lang";
import { getHomeData } from "@/lib/queries/home";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const ACCENT: Record<string, string> = { dub: "bg-dub", sub: "bg-white/80", anime: "bg-free", kids: "bg-available" };

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const home = edition.routes.home;
  return {
    title: { absolute: `Türkçe dublaj filmler ve diziler hangi platformda? · sofo ${edition.countryName}` },
    description: `Netflix, Disney+, Prime Video, HBO Max, TOD, tabii ve diğer yasal platformlarda hangi film ve dizinin Türkçe dublaj ya da altyazıyla olduğunu her gün kontrol ediyoruz.`,
    alternates: buildAlternates(home, { [edition.hreflang]: home }),
  };
}

export default async function EditionHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const [data, services] = await Promise.all([getHomeData(edition), getServices(edition)]);
  const r = edition.routes;
  const L = localLangName(edition.contentLang);

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

  return (
    <>
      {slides.length > 1 ? (
        <div className="pt-4 md:pt-6">
          <PromoSlider slides={slides} localLang={edition.hreflang} />
        </div>
      ) : null}

      {/* Search — the one thing sofo does that others don't: where + which language */}
      <section className="wrap pt-8 pb-2 md:pt-12 md:pb-4">
        <div className="mx-auto max-w-[860px] text-center">
          <h1 className="text-display">Every movie. Every service. <span className="text-text-3">Your language.</span></h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-text-2 md:text-base">
            Search once — we check {services.length} legal services in {edition.countryName} and tell you where it streams, and whether it has{" "}
            <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span> or subtitles.
          </p>
          <HeroSearch action={r.search} langLabel={L} />
          <ChipRow className="mt-4 md:justify-center">
            <ChipLink href={r.dubHub}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" />
              <span lang={edition.hreflang}>{cap(dubTerm(edition.contentLang))}</span>
            </ChipLink>
            <ChipLink href={r.anime}>Anime</ChipLink>
            <ChipLink href={r.kids}>Kids</ChipLink>
            <ChipLink href={r.newLeaving}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-leaving" />
              Leaving soon
            </ChipLink>
            <ChipLink href={`${r.movies}?offer=free`}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-free" />
              Free
            </ChipLink>
            <ChipLink href={r.releases}>Coming soon</ChipLink>
          </ChipRow>
          {data.trending.length ? (
            <p className="mx-auto mt-4 hidden max-w-3xl text-[13px] text-text-3 md:block">
              Trending:{" "}
              {data.trending.map((q, i) => (
                <span key={q}>
                  {i > 0 ? <span aria-hidden="true"> · </span> : null}
                  <Link href={paths.search(edition, q)} className="text-text-2 hover:text-text">
                    {q}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </section>

      <PosterRow title={`Top 10 in ${edition.countryName} this week`} cards={data.top} edition={edition} href={r.movies} ranked />

      {/* Browse by service */}
      <section className="wrap section-y" aria-labelledby="by-service">
        <SectionHeader id="by-service" title="Browse by service" sub={`What's on each platform in ${edition.countryName} — with language info`} />
        <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0 xl:grid-cols-8">
          {services.map((s) => (
            <li key={s.slug} className="shrink-0">
              <Link
                href={paths.service(edition, s.slug)}
                className="card card-hover flex w-[136px] flex-col items-center gap-3 px-3 py-5 text-center md:w-auto md:py-6"
              >
                <ServiceLogo {...s} size={52} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="tnum block text-xs text-text-3">{s.priceFrom ? `from ${formatPrice(s.priceFrom, s.currency)}/mo` : s.hasAdsTier ? "Free with ads" : "Subscription"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Watch in your language */}
      <section className="wrap section-y">
        <SectionHeader title="Watch in your language" sub={`Dubbed and subtitled, on legal services in ${edition.countryName}`} />
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {langCards.map((c) => (
            <li key={c.key}>
              <Link href={c.href} className="card card-hover group relative flex h-full min-h-[168px] flex-col justify-between overflow-hidden p-5 md:min-h-[220px] md:p-6">
                <span aria-hidden="true" className="absolute top-4 right-4 flex md:top-5 md:right-5">
                  {c.cards.slice(0, 3).map((card, i) => (
                    <span
                      key={card.id}
                      className="-ml-6 block w-[44px] transition duration-300 ease-out first:ml-0 group-hover:-translate-y-1 md:w-[56px]"
                      style={{ zIndex: 3 - i, rotate: `${(i - 1) * 6}deg`, transitionDelay: `${i * 30}ms` }}
                    >
                      <PosterImage path={card.posterPath} alt="" sizes="56px" className="rounded-[8px] ring-2 ring-surface" />
                    </span>
                  ))}
                </span>
                <span className="numeral relative">{c.count}</span>
                <span className="relative mt-auto block pt-8">
                  <span className="mb-2 flex items-center gap-2">
                    <span aria-hidden="true" className={`size-1.5 rounded-full ${ACCENT[c.key] ?? "bg-white"}`} />
                    <span lang="en" className="overline text-text-3">
                      titles
                    </span>
                  </span>
                  <span lang={c.local ? edition.hreflang : undefined} className="block text-base leading-tight font-medium md:text-lg">
                    {c.name}
                  </span>
                  <span className="mt-1 block text-xs text-text-3 md:text-[13px]">{c.sub}</span>
                </span>
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

      {data.leaving ? (
        <section className="wrap py-3">
          <Link
            href={paths.title(edition, data.leaving.type, data.leaving.slug)}
            className="panel card-hover group relative flex items-center gap-4 p-4 hover:text-text md:gap-6 md:p-5"
          >
            <span className="w-14 shrink-0 md:w-[68px]">
              <PosterImage path={data.leaving.posterPath} alt="" sizes="68px" className="rounded-[8px]" />
            </span>
            <span className="min-w-0 flex-1">
              <LeavingBadge>
                <span lang="en">LEAVING IN {daysUntil(data.leaving.leavingAt)} DAYS</span>
              </LeavingBadge>
              <span className="mt-2 block text-lg leading-snug font-medium md:text-[26px] md:tracking-[-0.03em]">
                {data.leaving.name} leaves {data.leaving.service}
              </span>
              <span className="mt-0.5 hidden text-sm text-text-2 sm:block">Last chance to watch it with your subscription.</span>
            </span>
            <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium text-text transition-colors group-hover:bg-white group-hover:text-ink">
              <span className="max-sm:sr-only">Watch now</span>
              <ArrowRightIcon className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Link>
        </section>
      ) : null}

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

      <SubscribeSection langName={langName(edition.contentLang)} />

      <section className="wrap section-y" lang={edition.hreflang}>
        <div className="max-w-3xl">
          <h2 className="text-h3 text-text-2">Türkçe dublaj filmler ve diziler — hangi platformda?</h2>
          <details className="group mt-2 text-sm leading-relaxed text-text-3">
            <summary className="list-none">
              <span>
                sofo; Netflix, Disney+, Prime Video, HBO Max, TOD, tabii, Exxen ve Gain gibi Türkiye&apos;deki yasal platformları her gün kontrol eder ve
                hangi film ve dizinin Türkçe dublaj ya da altyazıyla izlenebildiğini gösterir…
              </span>
              <span lang="en" className="mt-2 block font-bold text-text-2 group-open:hidden">
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
