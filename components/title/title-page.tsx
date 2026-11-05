import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SubscribeForm } from "@/components/retention/subscribe-form";
import { WatchlistButton } from "@/components/watchlist-button";
import { DubBadge, MutedBadge, SubBadge } from "@/components/ui/badges";
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
import { ShortAnswerBlock } from "./short-answer";
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
      images: [{ url: `/og/${edition.code}/${type}/${local.slug}`, width: 1200, height: 630 }],
    },
  };
}

export async function TitlePage({ params, type }: { params: Promise<Params>; type: "movie" | "tv" }) {
  const { edition, data } = await load(params, type);
  const { title, local, en, offers } = data;
  const lang = edition.contentLang;
  const similar = await getSimilar(edition, title.id, title.genres);
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
      <ul className="space-y-2">
        {xs.map((o) => (
          <OfferRow key={o.id} offer={o} lang={lang} titleName={local.name} country={edition.country} primary={o.id === firstPrimary} />
        ))}
      </ul>
    ) : null;
  const faq = buildFaq(data, edition);

  return (
    <article>
      <Breadcrumbs
        items={[
          { name: "Home", href: routes.home },
          { name: type === "movie" ? "Movies" : "Series", href: listRoute },
          { name: local.name },
        ]}
      />

      <div className="mx-auto max-w-site px-4 pt-4 md:px-7 md:pt-5">
        <ShortAnswerBlock data={data} edition={edition} />
      </div>

      {/* Hero: poster · details · where to watch */}
      <section className="relative mx-auto mt-5 max-w-site px-4 md:px-7">
        <div className="relative overflow-hidden rounded-hero border border-line-soft bg-surface">
          {backdrop ? (
            <>
              <Image src={backdrop} alt="" fill priority sizes="(max-width: 1360px) 100vw, 1360px" className="object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
            </>
          ) : null}
          <div className="relative grid grid-cols-[minmax(0,1fr)] gap-6 p-4 md:p-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="w-[132px] shrink-0 sm:w-[180px] lg:w-[200px]">
                <PosterImage path={title.posterPath} alt={`${local.name} poster`} priority sizes="200px" className="shadow-2xl shadow-black/60" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-2">
                  {title.originalTitle !== local.name ? `${title.originalTitle} · original title` : `${edition.countryName} title`}
                </p>
                <h1 className="mt-1 text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] md:text-[52px]">{local.name}</h1>
                <p className="mt-3 text-sm text-text-2">
                  {meta.join(" · ")}
                  {title.tmdbScore ? <span className="font-extrabold text-orange"> · TMDB {Number(title.tmdbScore).toFixed(1)}</span> : null}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hasDub ? <DubBadge>{dubTerm(lang)}</DubBadge> : null}
                  {hasSub ? <SubBadge>{subTerm(lang)}</SubBadge> : null}
                  {uhd ? <MutedBadge>4K</MutedBadge> : null}
                  {audioLangs.size > 1 ? <MutedBadge>+{audioLangs.size - (hasDub ? 1 : 0)} audio languages</MutedBadge> : null}
                  {!hasDub && offers.length ? <MutedBadge className="text-leaving">{langName(lang)} dub not confirmed</MutedBadge> : null}
                </div>
                {local.overview ? <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text md:text-base">{local.overview}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  {title.videos[0] ? (
                    <a href="#trailers" className={buttonClass("ghost")}>
                      ▶ Trailer
                    </a>
                  ) : null}
                  <WatchlistButton title={saved} variant="ghost" />
                  <ShareButton edition={edition.code} type={type} slug={local.slug} name={local.name} />
                </div>
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
        </div>
      </section>

      <div className="mx-auto mt-10 grid max-w-site gap-10 px-4 md:px-7 lg:grid-cols-2 lg:gap-8">
        {offers.length ? (
          <section aria-labelledby="langs">
            <SectionHeader id="langs" title="Audio & subtitles by service" sub="Only what the service confirms" />
            <LangMatrix offers={offers} editionLang={lang} originalLang={title.originalLang} />
          </section>
        ) : null}
        {title.videos.length ? (
          <section aria-labelledby="trailers" id="trailers" className="scroll-mt-24">
            <SectionHeader id="trailers-h" title="Trailers" sub={`${title.videos.length} video${title.videos.length > 1 ? "s" : ""}`} href={routes.trailers} linkLabel="All videos" />
            <div className="grid gap-4 sm:grid-cols-2">
              {title.videos.slice(0, 2).map((v) => (
                <figure key={v.id}>
                  <TrailerPlayer videoKey={v.key} title={`${local.name} — ${v.name}`} lang={v.lang} />
                  <figcaption className="mt-2 text-sm font-bold">
                    {v.name} — {v.lang ? langName(v.lang) : "Original"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {type === "tv" && title.seasons.length ? (
        <section className="mx-auto mt-10 max-w-site px-4 md:px-7">
          <SectionHeader title="Seasons & episodes" sub={`${dubTerm(lang)} status per season`} />
          <Seasons data={data} edition={edition} />
        </section>
      ) : null}

      <div className="mx-auto mt-10 max-w-site px-4 md:px-7">
        <History data={data} editionLang={lang} countryName={edition.countryName} />
      </div>

      {title.credits.length ? (
        <section className="mx-auto mt-10 max-w-site px-4 md:px-7">
          <SectionHeader title="Cast & crew" />
          <Cast data={data} edition={edition} />
        </section>
      ) : null}

      {data.franchiseCards.length > 1 && title.franchise ? (
        <PosterRow
          title={`${title.franchise.name}: watch order`}
          cards={data.franchiseCards}
          edition={edition}
          href={paths.franchise(edition, title.franchise.slug)}
        />
      ) : null}

      <PosterRow title={`If you liked ${local.name}`} sub={hasDub ? "Also with Turkish dub" : undefined} cards={similar} edition={edition} href={listRoute} />

      <div className="mx-auto mt-6 grid max-w-site gap-6 px-4 md:px-7 lg:grid-cols-[1.25fr_1fr]">
        <section aria-labelledby="faq">
          <SectionHeader id="faq" title="Questions people ask" />
          <Faq items={faq} />
        </section>
        <aside className="h-fit rounded-panel border border-line bg-surface p-5">
          <h2 className="text-[15px] font-extrabold">In other countries</h2>
          <p className="mt-2 text-sm text-text-2">
            sofo currently checks the {edition.countryName} catalogue. United States, Deutschland, France and more editions are on the way.
          </p>
          <p className="mt-3 text-xs text-text-3">Travelling? Availability depends on the country you watch from.</p>
          {en && en.name !== local.name ? <p className="mt-3 text-xs text-text-3">International title: {en.name}</p> : null}
          <div id="alerts" className="mt-5 scroll-mt-24 border-t border-line pt-5">
            <h2 className="text-[15px] font-extrabold">Follow {local.name}</h2>
            <p className="mt-1 mb-3 text-sm text-text-2">
              {hasDub ? "We'll tell you if it leaves or gets cheaper." : `We'll tell you when ${langName(lang)} dub arrives.`} Email or Telegram.
            </p>
            <SubscribeForm titleId={title.id} kinds={hasDub ? ["leaving", "price_drop"] : ["dub_available", "leaving"]} variant="compact" />
          </div>
        </aside>
      </div>

      <TitleJsonLd data={data} edition={edition} type={type} faq={faq} />
    </article>
  );
}

function NoOption() {
  return <p className="rounded-card bg-surface-2/60 p-4 text-sm text-text-2">Not on any subscription or free service here right now.</p>;
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
