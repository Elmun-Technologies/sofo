import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, InfoIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";
import { ServiceLogo } from "@/components/ui/service-logo";
import { hrefWith, one } from "@/components/value/filters";
import { SectionHead, ValueHero } from "@/components/value/layout";
import { TrailerPlayer, TrailerThumb } from "@/components/value/trailer-player";
import { LangBadges, ServiceLine, WatchButton, WatchTextLink, formatDuration } from "@/components/value/watch";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { dubTerm, langName, localLangName } from "@/lib/lang";
import { getTrailers, type TrailerItem } from "@/lib/queries/value-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/fragmanlar">): Promise<Metadata> {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) return {};
  return {
    title: `Official trailers — and where to watch the full movie in ${e.countryName}`,
    description: `Official trailers from studio YouTube channels, with the legal service and ${dubTerm(e.contentLang)} status for every title.`,
    alternates: buildAlternates(e.routes.trailers, { [e.hreflang]: e.routes.trailers }),
  };
}

const KIND: Record<string, string> = { trailer: "Trailer", teaser: "Teaser", clip: "Clip", featurette: "Featurette", episode_preview: "Preview", short: "Short" };

function isoDuration(sec: number | null) {
  return sec ? `PT${Math.floor(sec / 60)}M${sec % 60}S` : undefined;
}

export default async function TrailersPage({ params, searchParams }: PageProps<"/[lang]/fragmanlar">) {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) notFound();
  const sp = await searchParams;
  const base = e.routes.trailers;
  const langParam = one(sp.dil);
  const { items: all, langs } = await getTrailers(e);
  const filterLang = langParam && langs.includes(langParam) ? langParam : undefined;
  const items = filterLang ? all.filter((v) => v.lang === filterLang) : all;
  const current = { dil: filterLang };

  const horizontal = items.filter((v) => !v.isVertical);
  const shorts = items.filter((v) => v.isVertical);
  const featured = horizontal.find((v) => v.key === one(sp.v)) ?? horizontal[0];
  const rest = horizontal.filter((v) => v !== featured);
  const upNext = rest.slice(0, 5);
  const site = siteUrl();
  const checkedAt = items
    .map((v) => v.title.best?.checkedAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <>
      <ValueHero
        tags={
          <>
            <span className="tag">Official videos only</span>
            <span className="tag tnum">
              {items.length} {items.length === 1 ? "video" : "videos"}
            </span>
          </>
        }
        title="Trailers"
        intro={
          <>
            Straight from studio and service channels — each with the legal place to watch the full title in {e.countryName} and its{" "}
            <span lang={e.hreflang}>{dubTerm(e.contentLang)}</span> status.
          </>
        }
      >
        <ChipRow>
          <ChipLink href={hrefWith(base, {}, {})} active={!filterLang} scroll={false}>
            All languages
          </ChipLink>
          {langs.map((l) => (
            <ChipLink key={l} href={hrefWith(base, current, { dil: l, v: null })} active={filterLang === l} scroll={false}>
              {l === e.contentLang ? <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" /> : null}
              {l === e.contentLang ? `${localLangName(l)} trailers` : `${langName(l)}`}
            </ChipLink>
          ))}
        </ChipRow>
      </ValueHero>

      {!featured ? (
        <div className="wrap py-10 md:py-16">
          <EmptyState title="No official trailers in this language yet" action={<ButtonLink href={base} variant="secondary">Show all trailers</ButtonLink>}>
            We only embed official videos from studio and service channels.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* ── Featured + up next ── */}
          <section aria-label="Featured trailer" className="wrap grid grid-cols-1 gap-x-8 gap-y-6 pt-7 md:pt-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-x-10">
            <div className="min-w-0">
              <TrailerPlayer
                key={featured.key}
                videoKey={featured.key}
                title={`${featured.title.card.name} — ${featured.name}`}
                fallbackLabel={featured.title.card.name}
                lang={featured.lang}
                highlightLang={e.contentLang}
                duration={formatDuration(featured.durationSec)}
                playPosition="bottom-left"
                playSize="lg"
                className="rounded-panel md:rounded-hero"
                priority
              />
              <Featured item={featured} edition={e} />
            </div>

            {upNext.length > 0 ? (
              <aside className="max-lg:hidden">
                <h2 lang="en" className="overline pb-3 text-text-3">
                  Up next
                </h2>
                <ul className="divide-y divide-hairline border-t border-hairline-strong">
                  {upNext.map((v, i) => (
                    <li key={v.key} className={i > 3 ? "max-xl:hidden" : undefined}>
                      <Link href={hrefWith(base, current, { v: v.key })} scroll={false} className="group flex items-center gap-3.5 py-3 hover:text-text">
                        <TrailerThumb videoKey={v.key} className="w-[112px] xl:w-[128px]" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm leading-5 font-medium text-text-2 transition-colors group-hover:text-text">{v.title.card.name}</span>
                          <span className="tnum mt-0.5 block truncate text-xs leading-4 text-text-3">
                            {[KIND[v.kind] ?? v.kind, v.lang?.toUpperCase(), formatDuration(v.durationSec)].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </section>

          {/* ── Grid ── */}
          {rest.length > 0 ? (
            <section aria-labelledby="trending" className="wrap pt-12 md:pt-20">
              <SectionHead
                id="trending"
                title="Trending trailers"
                sub={
                  <>
                    Official videos only
                    {checkedAt ? (
                      <>
                        {" · "}availability <CheckedAt at={checkedAt} className="!text-[inherit] lowercase" />
                      </>
                    ) : null}
                  </>
                }
              />
              <ul className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-y-12">
                {rest.map((v) => (
                  <li key={v.key} className="min-w-0">
                    <TrailerCard item={v} edition={e} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {shorts.length > 0 ? (
            <section aria-labelledby="shorts" className="wrap pt-12 md:pt-20">
              <SectionHead id="shorts" title="Shorts" sub="Vertical clips from studio channels" />
              <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:gap-4 md:px-0">
                {shorts.map((v) => (
                  <li key={v.key} className="w-[156px] shrink-0 md:w-[188px]">
                    <TrailerPlayer videoKey={v.key} title={`${v.title.card.name} — ${v.name}`} fallbackLabel={v.name} highlightLang={e.contentLang} aspect="aspect-[9/16]" />
                    <p className="mt-2.5 truncate text-sm font-medium">{v.title.card.name}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="wrap flex items-start gap-2 pt-10 pb-14 text-xs leading-5 text-text-3 md:pt-14 md:pb-24">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            <span className="max-w-2xl">Official videos are embedded from YouTube (privacy-enhanced mode) and load only when you press play. We never download or re-edit them.</span>
          </p>
        </>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": items.slice(0, 30).map((v) => ({
            "@type": "VideoObject",
            name: `${v.title.card.name} — ${v.name}`,
            description: `${KIND[v.kind] ?? "Video"} for ${v.title.card.name}${v.title.card.year ? ` (${v.title.card.year})` : ""}.`,
            thumbnailUrl: `https://i.ytimg.com/vi/${v.key}/hqdefault.jpg`,
            ...(v.publishedAt ? { uploadDate: v.publishedAt.toISOString() } : {}),
            ...(isoDuration(v.durationSec) ? { duration: isoDuration(v.durationSec) } : {}),
            embedUrl: `https://www.youtube-nocookie.com/embed/${v.key}`,
            ...(v.lang ? { inLanguage: v.lang } : {}),
            about: {
              "@type": v.title.card.type === "tv" ? "TVSeries" : "Movie",
              name: v.title.card.name,
              url: new URL(paths.title(e, v.title.card.type, v.title.card.slug), site).toString(),
            },
          })),
        }}
      />
    </>
  );
}

/** Title, facts and the legal place to watch — under the featured player, never on top of it. */
function Featured({ item, edition }: { item: TrailerItem; edition: Edition }) {
  const { card, best } = item.title;
  const href = paths.title(edition, card.type, card.slug);
  const noun = card.type === "tv" ? "series" : "movie";
  const kind = KIND[item.kind] ?? "Video";
  const facts = [item.name.toLowerCase().includes(kind.toLowerCase()) ? null : kind, item.lang ? langName(item.lang) : null, formatDuration(item.durationSec), "plays on YouTube"].filter(Boolean).join(" · ");
  const meta = [card.type === "tv" ? "Series" : "Movie", card.year, card.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  return (
    <div className="mt-5 flex flex-col gap-6 md:mt-7 md:max-lg:flex-row md:max-lg:items-start md:max-lg:justify-between md:max-lg:gap-10 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
      <div className="min-w-0">
        <h2 className="text-h2">
          <Link href={href} className="hover:text-text">
            {card.name}
          </Link>
        </h2>
        <p className="tnum mt-2 text-sm text-text-2">
          {item.name} <span className="text-text-3">· {facts}</span>
        </p>
        <p className="tnum mt-1 text-sm text-text-3">{meta}</p>
      </div>

      <div className="shrink-0 md:max-lg:w-[320px] lg:max-xl:max-w-[400px] xl:w-[320px]">
        {best ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <ServiceLine option={best} size={36} />
              <LangBadges audio={best.audio} subtitle={best.subtitle} edition={edition} className="justify-end" />
            </div>
            <div className="mt-4 flex gap-2">
              <WatchButton option={best} title={card.name} edition={edition} label={`Watch the full ${noun}`} className="min-w-0 flex-1" />
              <Link
                href={href}
                aria-label={`Where to watch ${card.name}`}
                title="Where to watch"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset hover:bg-white/6 hover:ring-white/30"
              >
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
            <CheckedAt at={best.checkedAt} className="mt-3 block" />
          </>
        ) : (
          <>
            <p className="text-sm text-text-2">Not streaming in {edition.countryName} yet.</p>
            <ButtonLink href={href} variant="ghost" className="mt-4 max-md:w-full">
              Where to watch
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </>
        )}
      </div>
    </div>
  );
}

function TrailerCard({ item, edition }: { item: TrailerItem; edition: Edition }) {
  const { card, best } = item.title;
  const href = paths.title(edition, card.type, card.slug);
  const tag = [KIND[item.kind] ?? "Video", formatDuration(item.durationSec)].filter(Boolean).join(" · ");
  return (
    <>
      <TrailerPlayer videoKey={item.key} title={`${card.name} — ${item.name}`} fallbackLabel={card.name} lang={item.lang} highlightLang={edition.contentLang} duration={tag} />
      <Link href={href} className="mt-3.5 block truncate text-[15px] leading-6 font-medium md:text-base">
        {card.name}
        <span className="sr-only"> — {item.name}</span>
      </Link>
      <p className="tnum truncate text-[13px] leading-5 text-text-3" aria-hidden="true">
        {[item.name, card.year].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-2.5 flex min-w-0 items-center gap-2 text-[13px] leading-5 text-text-2">
        {best ? (
          <>
            <ServiceLogo slug={best.serviceSlug} name={best.serviceName} logoPath={best.logoPath} size={20} />
            <span className="truncate">{best.serviceName}</span>
            <WatchTextLink option={best} title={card.name} edition={edition} label={`Watch the full ${card.type === "tv" ? "series" : "movie"}`} className="ml-auto shrink-0" />
          </>
        ) : (
          <span className="text-text-3">Not streaming in {edition.countryName} yet</span>
        )}
      </div>
    </>
  );
}
