import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SubscribeForm } from "@/components/retention/subscribe-form";
import { WatchlistButton } from "@/components/watchlist-button";
import { ArrowUpRightIcon, CaptionsIcon, PlayIcon, VolumeIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { Pill } from "@/components/ui/badges";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { PosterRow } from "@/components/ui/poster-row";
import { SectionHeader } from "@/components/ui/section-header";
import { TrailerPlayer } from "@/components/value/trailer-player";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getSimilar, getTitlePage, type TitlePageData } from "@/lib/queries/title";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";
import { Cast } from "./cast";
import { buildFaq, Faq } from "./faq";
import { History } from "./history";
import { LangMatrix } from "./lang-matrix";
import { OfferRow } from "./offer-row";
import { Seasons } from "./seasons";
import { ShareButton } from "./share-button";
import { ShortAnswerBlock, ShortAnswerFacts } from "./short-answer";
import { StickyCta } from "./sticky-cta";
import { WhereToWatchTabs } from "./where-to-watch";

type Params = { lang: string; slug: string };

async function load(params: Promise<Params>, type: "movie" | "tv") {
  const { lang, slug } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const data = await getTitlePage(edition, type, slug);
  if (!data) notFound();
  return { edition, data };
}

export async function titleMetadata(params: Promise<Params>, type: "movie" | "tv"): Promise<Metadata> {
  const { edition, data } = await load(params, type);
  const { local, title, offers } = data;
  const path = paths.title(edition, type, local.slug);
  const lang = edition.contentLang;
  const dub = [...new Set(offers.filter((o) => o.audio[lang] === "confirmed_yes").map((o) => o.service.name))];
  const services = [...new Set(offers.map((o) => o.service.name))];
  // Title/description in the edition language: they target local queries ("… hangi platformda").
  const description = services.length
    ? `${local.name}${title.year ? ` (${title.year})` : ""} ${edition.countryName}'de ${services.join(", ")} üzerinde. ${dub.length ? `Türkçe dublaj: ${dub.join(", ")}.` : "Türkçe dublaj henüz doğrulanmadı."} Fiyatlar, altyazı ve tarihçe.`
    : `${local.name} şu an ${edition.countryName}'de yasal olarak yayında değil. Geldiğinde haber verelim.`;
  return {
    title: `${local.name}${title.year ? ` (${title.year})` : ""} nerede izlenir? ${dub.length ? "Türkçe dublaj" : "Platformlar"}`,
    description,
    alternates: buildAlternates(path, { [edition.hreflang]: path }),
    robots: data.gate.index ? undefined : { index: false, follow: true },
    openGraph: {
      title: local.name,
      description,
      type: type === "movie" ? "video.movie" : "video.tv_show",
      url: path,
      images: [{ url: `/og/${edition.code}/${type}/${local.slug}` }],
    },
  };
}

export async function TitlePage({ params, type }: { params: Promise<Params>; type: "movie" | "tv" }) {
  const { edition, data } = await load(params, type);
  const { title, local, en, offers } = data;
  const lang = edition.contentLang;
  const similar = await getSimilar(edition, { id: title.id, genres: title.genres, type: title.type, isKids: title.isKids });
  const routes = edition.routes;
  const listRoute = type === "movie" ? routes.movies : routes.series;
  const hasDub = offers.some((o) => o.audio[lang] === "confirmed_yes");
  const hasSub = offers.some((o) => o.subtitle[lang] === "confirmed_yes");
  const audioLangs = new Set(offers.flatMap((o) => Object.entries(o.audio).filter(([, s]) => s === "confirmed_yes").map(([l]) => l)));
  const uhd = offers.some((o) => o.quality === "uhd");
  const backdrop = imageUrl(title.backdropPath, "w1280");
  const saved = { id: title.id, type: title.type, slug: local.slug, name: local.name, posterPath: title.posterPath, year: title.year };
  const seasonsCount = title.seasons.length;
  const meta = [
    type === "movie" ? "Movie" : "Series",
    title.year ? (type === "tv" && seasonsCount > 1 ? `${title.year}–${title.year + seasonsCount - 1}` : String(title.year)) : null,
    type === "movie" ? formatRuntime(title.runtimeMin) : seasonsCount ? `${seasonsCount} season${seasonsCount > 1 ? "s" : ""}` : null,
    title.genres.join(", ") || null,
  ].filter(Boolean);

  const stream = offers.filter((o) => o.type === "subscription" || o.type === "free" || o.type === "ads");
  const rent = offers.filter((o) => o.type === "rent");
  const buy = offers.filter((o) => o.type === "buy");
  const firstPrimary = offers[0]?.id;
  const list = (xs: typeof offers) =>
    xs.length ? (
      <ul className="divide-y divide-hairline">
        {xs.map((o) => (
          <OfferRow key={o.id} offer={o} lang={lang} titleName={local.name} country={edition.country} primary={o.id === firstPrimary} />
        ))}
      </ul>
    ) : null;
  const faq = buildFaq(data, edition);

  const primary = data.shortAnswer.kind !== "none" ? data.shortAnswer.offer : null;
  const facts: [string, React.ReactNode][] = [
    ["Original title", title.originalTitle],
    ...(en && en.name !== local.name && en.name !== title.originalTitle ? ([["International title", en.name]] as [string, React.ReactNode][]) : []),
    ["Type", type === "movie" ? "Movie" : "Series"],
    ...(title.year ? ([["Year", String(title.year)]] as [string, React.ReactNode][]) : []),
    ...(type === "movie" && title.runtimeMin ? ([["Runtime", formatRuntime(title.runtimeMin)]] as [string, React.ReactNode][]) : []),
    ...(type === "tv" && seasonsCount ? ([["Seasons", String(seasonsCount)]] as [string, React.ReactNode][]) : []),
    ...(title.genres.length ? ([["Genres", title.genres.join(", ")]] as [string, React.ReactNode][]) : []),
    ["Original language", langName(title.originalLang)],
  ];

  return (
    <article className="pb-4 max-md:pb-20">
      {/* Hero (ivi-style cinema-dark band): backdrop · poster · the answer · where to watch */}
      <div className="theme-dark relative isolate bg-ink">
        {backdrop ? (
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[50%_20%] opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/55" />
          </div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_100%_at_20%_0%,rgb(255_90_31/0.12),transparent_70%)]" />
        )}

        <Breadcrumbs
          items={[
            { name: "Home", href: routes.home },
            { name: type === "movie" ? "Movies" : "Series", href: listRoute },
            { name: local.name },
          ]}
        />

        <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-8 pt-5 pb-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 gap-4 md:gap-8">
            <div className="w-[104px] shrink-0 sm:w-[168px] xl:w-[216px]">
              <PosterImage path={title.posterPath} alt={`${local.name} poster`} priority sizes="(max-width: 480px) 104px, 216px" className="shadow-poster" />
              <div className="mt-3 hidden gap-2 sm:grid">
                <WatchlistButton title={saved} variant="secondary" />
                <ShareButton edition={edition.code} type={type} slug={local.slug} name={local.name} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[26px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[36px] xl:text-[46px]">{local.name}</h1>
              {title.originalTitle !== local.name ? <p className="mt-1.5 text-sm text-text-2 md:text-[15px]">{title.originalTitle}</p> : null}
              <p className="tnum mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] font-semibold text-text-2 md:text-sm">
                {title.tmdbScore ? (
                  <span className="inline-flex items-center gap-1 text-[15px] font-extrabold text-available" title="TMDB score">
                    {Number(title.tmdbScore).toFixed(1)}
                  </span>
                ) : null}
                {meta.map((m, i) => (
                  <span key={i}>
                    {i > 0 ? <span aria-hidden="true" className="mr-2 text-text-3">•</span> : null}
                    {m}
                  </span>
                ))}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {hasDub ? (
                  <Pill tone="dub">
                    <VolumeIcon className="size-3.5" />
                    <span lang={edition.hreflang}>{dubTerm(lang)}</span>
                  </Pill>
                ) : null}
                {hasSub ? (
                  <Pill>
                    <CaptionsIcon className="size-3.5" />
                    <span lang={edition.hreflang} className="text-text">{subTerm(lang)}</span>
                  </Pill>
                ) : null}
                {uhd ? <Pill>4K</Pill> : null}
                {audioLangs.size > 1 ? <Pill>+{audioLangs.size - (hasDub ? 1 : 0)} audio languages</Pill> : null}
                {!hasDub && offers.length ? <Pill tone="leaving">{langName(lang)} dub not confirmed</Pill> : null}
              </div>

              <div className="mt-6 hidden sm:block md:mt-8">
                <ShortAnswerBlock data={data} edition={edition} />
              </div>
            </div>
          </div>

          <div className="sm:hidden">
            <ShortAnswerBlock data={data} edition={edition} idPrefix="answer" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <WatchlistButton title={saved} variant="secondary" />
              <ShareButton edition={edition.code} type={type} slug={local.slug} name={local.name} />
            </div>
          </div>

          <WhereToWatchTabs
            heading={`Where to watch in ${edition.countryName}`}
            tabs={[
              { key: "stream", label: "Stream", count: stream.length, content: list(stream) ?? <NoOption /> },
              { key: "rent", label: "Rent", count: rent.length, content: list(rent) },
              { key: "buy", label: "Buy", count: buy.length, content: list(buy) },
            ]}
            footer={
              data.checkedAt ? (
                <p className="text-xs text-text-3">
                  <CheckedAt at={data.checkedAt} /> · prices are set by the service
                </p>
              ) : (
                <p className="text-xs text-text-3">No legal option found in {edition.countryName} yet.</p>
              )
            }
          />
        </div>

        <div className="wrap pb-8 md:pb-10">
          <ShortAnswerFacts data={data} edition={edition} />
        </div>
      </div>

      <div className="wrap mt-10 grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-12 md:mt-14 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-12 md:space-y-14">
          {local.overview ? (
            <section aria-labelledby="story">
              <SectionHeader id="story" title="Storyline" />
              <p lang={edition.hreflang} className="max-w-3xl text-[15px] leading-relaxed text-text-2 md:text-base">
                {local.overview}
              </p>
              {title.videos[0] ? (
                <a href="#trailers" className={`${buttonClass("ghost", "sm")} mt-4`}>
                  <PlayIcon className="size-3.5" />
                  Watch trailer
                </a>
              ) : null}
            </section>
          ) : null}

          {offers.length ? (
            <section aria-labelledby="langs">
              <SectionHeader id="langs" title="Audio & subtitles by service" sub="Only what the service confirms — we never guess" />
              <LangMatrix offers={offers} editionLang={lang} originalLang={title.originalLang} />
            </section>
          ) : null}

          {type === "tv" && title.seasons.length ? (
            <section aria-labelledby="seasons">
              <SectionHeader
                id="seasons"
                title="Seasons & episodes"
                sub={
                  title.seasons.some((s) => s.offers.length > 0)
                    ? `${dubTerm(lang)} status per season`
                    : `${seasonsCount} seasons · language info above covers the whole series`
                }
              />
              <Seasons data={data} edition={edition} />
            </section>
          ) : null}

          {title.videos.length ? (
            <section aria-labelledby="trailers-h" id="trailers" className="scroll-mt-24">
              <SectionHeader id="trailers-h" title="Trailers" href={routes.trailers} linkLabel="All trailers" />
              <div className="grid gap-4 sm:grid-cols-2">
                {title.videos.slice(0, 2).map((v) => (
                  <figure key={v.id}>
                    <TrailerPlayer videoKey={v.key} title={`${local.name} — ${v.name}`} lang={v.lang} />
                    <figcaption className="mt-2.5 text-sm font-semibold">
                      {v.name} <span className="font-medium text-text-3">· {v.lang ? langName(v.lang) : "Original"}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <History data={data} editionLang={lang} countryName={edition.countryName} />

          {title.credits.length ? (
            <section aria-labelledby="cast">
              <SectionHeader id="cast" title="Cast & crew" />
              <Cast data={data} edition={edition} />
            </section>
          ) : null}

          <section aria-labelledby="faq">
            <SectionHeader id="faq" title="Questions people ask" />
            <Faq items={faq} />
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-36 lg:h-fit">
          <div id="alerts" className="panel scroll-mt-24 p-5">
            <h2 className="text-h3">Follow {local.name}</h2>
            <p className="mt-1.5 mb-4 text-sm text-text-2">
              {hasDub ? "We'll tell you if it leaves or gets cheaper." : `We'll tell you when ${langName(lang)} dub arrives.`} Email or Telegram.
            </p>
            <SubscribeForm titleId={title.id} kinds={hasDub ? ["leaving", "price_drop"] : ["dub_available", "leaving"]} variant="compact" />
          </div>

          <div className="panel p-5">
            <h2 className="text-h3">Details</h2>
            <dl className="mt-3 divide-y divide-hairline text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex gap-4 py-2.5">
                  <dt className="w-[42%] shrink-0 text-text-3">{k}</dt>
                  <dd className="min-w-0 flex-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-5">
            <h2 className="text-h3">In other countries</h2>
            <p className="mt-2 text-sm text-text-2">
              sofo currently checks the {edition.countryName} catalogue. United States, Deutschland, France and more editions are on the way.
            </p>
            <p className="mt-2 text-xs text-text-3">Travelling? Availability depends on the country you watch from.</p>
          </div>
        </aside>
      </div>

      <div className="mt-8 md:mt-12">
        {data.franchiseCards.length > 1 && title.franchise ? (
          <PosterRow
            title={`${title.franchise.name}: watch order`}
            cards={data.franchiseCards}
            edition={edition}
            href={paths.franchise(edition, title.franchise.slug)}
          />
        ) : null}

        <PosterRow title={`If you liked ${local.name}`} sub={hasDub ? `Also with ${langName(lang)} dub` : undefined} cards={similar} edition={edition} href={listRoute} />
      </div>

      {/* Phones: the answer's action stays one thumb away. */}
      {primary ? (
        <StickyCta targetId="answer-cta">
          <OutboundLink
            href={primary.url}
            service={primary.serviceSlug}
            title={local.name}
            country={edition.country}
            lang={data.shortAnswer.kind === "yes_audio" ? lang : undefined}
            offerType={primary.type}
            className={`${buttonClass("accent")} w-full`}
          >
            {primary.type === "rent" ? "Rent" : primary.type === "buy" ? "Buy" : "Watch"} on {primary.serviceName}
            <ArrowUpRightIcon className="size-[18px]" />
          </OutboundLink>
        </StickyCta>
      ) : null}

      <TitleJsonLd data={data} edition={edition} type={type} faq={faq} />
    </article>
  );
}

function NoOption() {
  return <p className="rounded-card bg-text/5 p-4 text-sm text-text-2">Not on any subscription or free service here right now.</p>;
}

function TitleJsonLd({ data, edition, type, faq }: { data: TitlePageData; edition: Edition; type: "movie" | "tv"; faq: { q: string; a: string }[] }) {
  const { title, local, en, offers } = data;
  const url = new URL(paths.title(edition, type, local.slug), siteUrl()).toString();
  const poster = imageUrl(title.posterPath, "w500");
  const dateModified = (data.checkedAt ?? title.updatedAt).toISOString();
  const languages = [...new Set(offers.flatMap((o) => Object.entries(o.audio).filter(([, s]) => s === "confirmed_yes").map(([l]) => l)))];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": type === "movie" ? "Movie" : "TVSeries",
          name: local.name,
          alternateName: [title.originalTitle, en?.name].filter((n, i, a) => n && n !== local.name && a.indexOf(n) === i),
          url,
          ...(poster ? { image: new URL(poster, siteUrl()).toString() } : {}),
          ...(local.overview ? { description: local.overview } : {}),
          ...(title.year ? { datePublished: String(title.year) } : {}),
          genre: title.genres,
          inLanguage: title.originalLang,
          ...(languages.length ? { availableLanguage: languages } : {}),
          ...(type === "tv" ? { numberOfSeasons: title.seasons.length } : {}),
          ...(title.runtimeMin && type === "movie" ? { duration: `PT${title.runtimeMin}M` } : {}),
          director: title.credits.filter((c) => c.job === "Director").map((c) => ({ "@type": "Person", name: c.person.name })),
          dateModified,
          ...(offers.length
            ? {
                potentialAction: offers.map((o) => ({
                  "@type": "WatchAction",
                  target: { "@type": "EntryPoint", urlTemplate: o.url, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
                  provider: { "@type": "Organization", name: o.service.name },
                  expectsAcceptanceOf: {
                    "@type": "Offer",
                    category: o.type === "subscription" ? "subscription" : o.type === "rent" ? "rental" : o.type === "buy" ? "purchase" : "free",
                    eligibleRegion: { "@type": "Country", name: edition.country },
                    ...(o.price != null ? { price: o.price, priceCurrency: o.currency ?? "TRY" } : {}),
                  },
                })),
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}
