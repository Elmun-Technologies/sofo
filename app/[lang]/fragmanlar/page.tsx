import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DubBadge, MutedBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/section-header";
import { ServiceLogo } from "@/components/ui/service-logo";
import { hrefWith, one } from "@/components/value/filters";
import { TrailerPlayer } from "@/components/value/trailer-player";
import { WatchTextLink, formatDuration } from "@/components/value/watch";
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
  const upNext = rest.slice(0, 4);
  const site = siteUrl();

  return (
    <>
      <header className="mx-auto max-w-site px-4 pt-5 md:px-7 md:pt-8">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[48px]">Trailers</h1>
        <ChipRow className="mt-4 md:mt-5">
          <ChipLink href={hrefWith(base, {}, {})} active={!filterLang} scroll={false}>
            All languages
          </ChipLink>
          {langs.map((l) => (
            <ChipLink key={l} href={hrefWith(base, current, { dil: l, v: null })} active={filterLang === l} scroll={false}>
              {l === e.contentLang ? `${localLangName(l)} trailers` : `${langName(l)}`}
            </ChipLink>
          ))}
        </ChipRow>
      </header>

      {!featured ? (
        <div className="mx-auto max-w-site px-4 py-10 md:px-7">
          <EmptyState title="No official trailers in this language yet" action={<ButtonLink href={base} variant="secondary">Show all trailers</ButtonLink>}>
            We only embed official videos from studio and service channels.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* ── Featured + up next ── */}
          <section aria-label="Featured trailer" className="mx-auto grid max-w-site grid-cols-1 gap-5 px-4 pt-5 md:px-7 md:pt-8 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-4">
            <div className="min-w-0">
              <TrailerPlayer
                key={featured.key}
                videoKey={featured.key}
                title={`${featured.title.card.name} — ${featured.name}`}
                playPosition="bottom-left"
                aspect="aspect-video lg:aspect-[16/9]"
                className="rounded-[18px] md:rounded-hero"
                priority
                overlay={
                  <div className="absolute inset-x-0 bottom-0 py-4 pr-4 pl-[88px] md:pr-6 md:pb-6 md:pl-[104px]">
                    <div className="flex flex-wrap gap-1.5">
                      {featured.title.card.dub ? <DubBadge>{dubTerm(e.contentLang).toLocaleUpperCase("tr")}</DubBadge> : null}
                      <span className="hidden md:inline-flex"><MutedBadge className="bg-black/70!">OFFICIAL · {(featured.lang ?? "").toUpperCase() || "YOUTUBE"}</MutedBadge></span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-lg leading-tight font-extrabold md:text-[28px]">
                      {featured.title.card.name} — {featured.name}
                    </p>
                  </div>
                }
              />
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-sm text-text-2">
                  {[formatDuration(featured.durationSec), "Plays on YouTube", featured.title.best ? `full ${featured.title.card.type === "tv" ? "series" : "movie"} on ${featured.title.best.serviceName}` : "not streaming in " + e.countryName].filter(Boolean).join(" · ")}
                </p>
                <ButtonLink href={paths.title(e, featured.title.card.type, featured.title.card.slug)} size="sm" className="ml-auto">
                  Where to watch →
                </ButtonLink>
              </div>
            </div>

            {upNext.length > 0 ? (
              <aside className="hidden lg:block">
                <h2 className="mb-2.5 text-[15px] font-extrabold">Up next</h2>
                <ul className="flex flex-col gap-2.5">
                  {upNext.map((v) => (
                    <li key={v.key}>
                      <Link href={hrefWith(base, current, { v: v.key })} scroll={false} className="flex items-center gap-3 rounded-[14px] bg-surface p-2 hover:bg-surface-2 hover:text-text">
                        <span className="relative aspect-video w-[112px] shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
                          <img src={`https://i.ytimg.com/vi/${v.key}/mqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-extrabold">{v.title.card.name}</span>
                          <span className="block truncate text-xs text-text-2">
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
            <section className="mx-auto max-w-site px-4 pt-8 pb-4 md:px-7 md:pt-12">
              <SectionHeader title="Trending trailers" sub="Official videos only" />
              <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rest.map((v) => (
                  <li key={v.key} className="min-w-0">
                    <TrailerCard item={v} edition={e} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {shorts.length > 0 ? (
            <section className="mx-auto max-w-site px-4 pt-8 pb-4 md:px-7 md:pt-10">
              <SectionHeader title="Shorts" sub="Vertical clips from studio channels" />
              <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
                {shorts.map((v) => (
                  <li key={v.key} className="w-[150px] shrink-0 md:w-[170px]">
                    <TrailerPlayer
                      videoKey={v.key}
                      title={`${v.title.card.name} — ${v.name}`}
                      aspect="aspect-[9/16]"
                      overlay={<span className="absolute inset-x-2.5 bottom-2.5 line-clamp-2 text-sm font-extrabold">{v.name}</span>}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="mx-auto max-w-site px-4 pt-4 pb-12 text-xs text-text-3 md:px-7">
            Official videos are embedded from YouTube (privacy-enhanced mode) and load only when you press play. We never download or re-edit them.
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

function TrailerCard({ item, edition }: { item: TrailerItem; edition: Edition }) {
  const { card, best } = item.title;
  const href = paths.title(edition, card.type, card.slug);
  return (
    <>
      <TrailerPlayer videoKey={item.key} title={`${card.name} — ${item.name}`} lang={item.lang} duration={`${KIND[item.kind] ?? "Video"}${formatDuration(item.durationSec) ? ` ${formatDuration(item.durationSec)}` : ""}`} />
      <Link href={href} className="mt-2.5 block truncate text-[15px] font-extrabold">
        {card.name} — {item.name}
      </Link>
      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-text-2">
        {best ? (
          <>
            <ServiceLogo slug={best.serviceSlug} name={best.serviceName} logoPath={best.logoPath} size={16} />
            <span className="truncate">{best.serviceName} ·</span>
            <WatchTextLink option={best} title={card.name} edition={edition} label={`Watch the full ${card.type === "tv" ? "series" : "movie"}`} className="text-xs! font-bold! text-text-2!" />
          </>
        ) : (
          <span>Not streaming in {edition.countryName} yet</span>
        )}
      </p>
    </>
  );
}
