import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CaptionsIcon, ChevronLeftIcon, StarIcon, VolumeIcon } from "@/components/icons";
import { LangMark, Pill } from "@/components/ui/badges";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { AlertButton } from "@/components/value/alert-button";
import { SectionHead } from "@/components/value/layout";
import { TrailerPlayer } from "@/components/value/trailer-player";
import { LangBadges, RatingBar, ServiceLine, WatchButton, formatDuration } from "@/components/value/watch";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { formatDate, formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName, localLangName, subTerm } from "@/lib/lang";
import { getSeasonPage } from "@/lib/queries/value-pages";
import type { LangState } from "@/lib/short-answer";

export const revalidate = 3600;

/** "sezon-2" → 2 (edition-local segment). */
function parseSeason(e: Edition, segment: string): number | null {
  const m = new RegExp(`^${e.segments.season}-(\\d{1,3})$`).exec(segment);
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

const load = cache(async (lang: string, slug: string, segment: string) => {
  const edition = getEdition(lang);
  if (!edition) return null;
  const n = parseSeason(edition, segment);
  if (n === null) return null;
  const data = await getSeasonPage(edition, slug, n);
  return data ? { edition, data } : null;
});

export async function generateMetadata({ params }: PageProps<"/[lang]/dizi/[slug]/[season]">): Promise<Metadata> {
  const { lang, slug, season } = await params;
  const r = await load(lang, slug, season);
  if (!r) return {};
  const { edition, data } = r;
  const path = paths.season(edition, data.title.slug, data.season.number);
  return {
    title: `${data.title.name} — Season ${data.season.number}: where to watch, episodes, Turkish dub`,
    description: `${data.title.name} season ${data.season.number} in ${edition.countryName}: episodes, services and audio / subtitle languages per service.`,
    // MVP: season pages are not indexed (CLAUDE.md page inventory #5).
    robots: { index: false, follow: true },
    alternates: { canonical: path },
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function SeasonPage({ params }: PageProps<"/[lang]/dizi/[slug]/[season]">) {
  const { lang, slug, season: segment } = await params;
  const r = await load(lang, slug, segment);
  if (!r) notFound();
  const { edition, data } = r;
  const { title, season, episodes, best, options, matrix, services, video } = data;
  const code = edition.code.toUpperCase();
  const seriesHref = paths.title(edition, "tv", title.slug);
  const index = data.seasons.findIndex((s) => s.number === season.number);
  const prev = index > 0 ? data.seasons[index - 1] : undefined;
  const next = index >= 0 ? data.seasons[index + 1] : undefined;
  const isFinal = data.seasons.at(-1)?.number === season.number;
  const year = season.airDate ? new Date(season.airDate).getUTCFullYear() : null;
  const epCount = episodes.length || season.episodeCount;
  const backdrop = imageUrl(title.backdropPath, "w1280");
  const hasStills = episodes.some((ep) => ep.stillPath);
  const checkedAt = options.map((o) => o.checkedAt).sort((a, b) => b.getTime() - a.getTime())[0];
  const ctaLabel = best ? `Watch S${season.number} on ${best.serviceName}` : null;
  const savedTitle = { id: title.id, type: "tv" as const, slug: title.slug, name: title.name, posterPath: title.posterPath, year: title.year };

  const seasonTabs = (
    <ChipRow>
      {data.seasons.map((s) => (
        <ChipLink key={s.id} href={paths.season(edition, title.slug, s.number)} active={s.number === season.number} scroll={false}>
          Season {s.number}
        </ChipLink>
      ))}
      <ChipLink href={seriesHref}>All seasons</ChipLink>
    </ChipRow>
  );

  return (
    <div className={best ? "max-md:pb-16" : undefined}>
      {/* ── Header: series, season, language status, where to watch ── */}
      <div className="relative isolate">
        {backdrop ? (
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[50%_20%] opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/60" />
          </div>
        ) : null}

        <Breadcrumbs
          items={[
            { name: "Home", href: edition.routes.home },
            { name: "Series", href: edition.routes.series },
            { name: title.name, href: seriesHref },
            { name: `Season ${season.number}` },
          ]}
        />

        <header className="wrap grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-7 pt-6 pb-8 md:pt-10 md:pb-14 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 gap-4 md:gap-8">
            <PosterImage path={season.posterPath} alt={`${title.name} season ${season.number} poster`} priority sizes="(max-width: 768px) 92px, 168px" className="w-[92px] shrink-0 self-start md:w-[168px]" />
            <div className="min-w-0 flex-1">
              <Link href={seriesHref} className="-ml-1 inline-flex max-w-full items-center gap-1 text-sm text-text-2 hover:text-text md:text-base">
                <ChevronLeftIcon className="size-4 shrink-0" />
                <span className="truncate">{title.name}</span>
              </Link>
              <h1 className="text-display mt-1.5 md:mt-2">
                <span className="sr-only">{title.name} — </span>Season {season.number}
              </h1>
              <ul className="tnum mt-4 flex flex-wrap gap-1.5 md:mt-6 md:gap-2">
                {year ? <li className="tag">{year}</li> : null}
                {epCount ? (
                  <li className="tag">
                    {epCount} {epCount === 1 ? "episode" : "episodes"}
                  </li>
                ) : null}
                {isFinal ? <li className="tag">Latest season</li> : null}
                {season.score ? (
                  <li className="tag" title="TMDB score">
                    <StarIcon className="size-3 text-text-3" />
                    <span className="sr-only">TMDB </span>
                    {season.score.toFixed(1)}
                  </li>
                ) : null}
              </ul>
              <div className="mt-5 max-md:hidden md:mt-7">
                <SeasonLanguage best={best} edition={edition} />
              </div>
              <div className="mt-6 max-md:hidden">{seasonTabs}</div>
            </div>
          </div>

          <div className="md:hidden">
            <SeasonLanguage best={best} edition={edition} />
            <div className="mt-5">{seasonTabs}</div>
          </div>

          <section aria-labelledby="where" className="panel h-fit bg-surface/85 p-5 backdrop-blur-xl md:p-6">
            <h2 id="where" className="text-h3">
              Where to watch season {season.number}
            </h2>
            {!data.seasonLevel && options.length > 0 ? (
              <p className="mt-1.5 text-xs leading-5 text-leaving">Season-level data not available — showing the series offer.</p>
            ) : null}
            {options.length === 0 ? (
              <p className="mt-3 text-sm text-text-2">Not on any legal service in {edition.countryName} right now.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {options.map((o, i) => (
                  <li key={`${o.serviceSlug}-${o.type}-${i}`} className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <ServiceLine option={o} size={40} note={o.quality ? o.quality.toUpperCase() : undefined} />
                      <WatchButton option={o} title={title.name} edition={edition} label="Watch" variant={o === best ? "accent" : "secondary"} size="sm" />
                    </div>
                    <LangBadges audio={o.audio} subtitle={o.subtitle} edition={edition} className="mt-3" />
                  </li>
                ))}
              </ul>
            )}
            {checkedAt ? (
              <p className="border-t border-hairline pt-4 text-xs text-text-3">
                <CheckedAt at={checkedAt} /> · {data.seasonLevel ? "whole season" : "series offer"}
              </p>
            ) : null}
          </section>
        </header>
      </div>

      {/* ── Episodes + side panels ── */}
      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-12 pt-6 md:pt-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <section aria-labelledby="episodes" className="min-w-0">
          <SectionHead
            id="episodes"
            title={epCount ? `${epCount} ${epCount === 1 ? "episode" : "episodes"}` : "Episodes"}
            sub={season.airDate ? `From ${formatDate(season.airDate, { day: "numeric", month: "short", year: "numeric" })}` : undefined}
          />
          {episodes.length === 0 ? (
            <p className="rounded-card border border-dashed border-hairline-strong px-5 py-8 text-sm text-text-2">
              Episode list for this season isn&apos;t available yet. We add it as soon as the metadata source publishes it.
            </p>
          ) : (
            <>
              <div aria-hidden="true" lang="en" className={`overline hidden items-center gap-x-5 pb-3 text-text-3 md:grid ${hasStills ? EP_COLS_STILL : EP_COLS}`}>
                <span>No.</span>
                {hasStills ? <span /> : null}
                <span>Episode</span>
                <span>Air date</span>
                <span>Runtime</span>
                <span className="text-right">TMDB</span>
              </div>
              <ol className="border-b border-hairline">
                {episodes.map((ep) => {
                  const still = imageUrl(ep.stillPath, "w300");
                  return (
                    <li key={ep.id} className={`grid items-center gap-x-3.5 border-t border-hairline py-3.5 md:gap-x-5 md:py-4 ${hasStills ? `grid-cols-[32px_96px_minmax(0,1fr)_auto] ${EP_COLS_STILL}` : `grid-cols-[32px_minmax(0,1fr)_auto] ${EP_COLS}`}`}>
                      <span className="tnum text-xl leading-none font-normal tracking-[-0.04em] text-text-3 md:text-[28px]">
                        <span className="sr-only">Episode </span>
                        {pad(ep.number)}
                      </span>
                      {hasStills ? (
                        <span className="relative block aspect-video overflow-hidden rounded-[10px] bg-surface-2">
                          {still ? <Image src={still} alt="" fill sizes="132px" className="object-cover" /> : null}
                          <span aria-hidden="true" className="absolute inset-0 rounded-[inherit] ring-1 ring-white/8 ring-inset" />
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] leading-6 font-medium md:text-[17px]">{ep.name ?? `Episode ${ep.number}`}</h3>
                        {ep.overview ? <p lang={edition.hreflang} className="line-clamp-1 text-[13px] leading-5 text-text-3 max-md:hidden">{ep.overview}</p> : null}
                        <p className="tnum text-[13px] leading-5 text-text-3 md:hidden">
                          {ep.airDate ? <time dateTime={ep.airDate.toISOString().slice(0, 10)}>{formatDate(ep.airDate)}</time> : null}
                          {ep.airDate && ep.runtimeMin ? " · " : ""}
                          {ep.runtimeMin ? formatRuntime(ep.runtimeMin) : ""}
                        </p>
                      </div>
                      <span className="tnum text-sm text-text-2 max-md:hidden">
                        {ep.airDate ? <time dateTime={ep.airDate.toISOString().slice(0, 10)}>{formatDate(ep.airDate)}</time> : <span className="text-text-3">—</span>}
                      </span>
                      <span className="tnum text-sm text-text-2 max-md:hidden">{formatRuntime(ep.runtimeMin) ?? <span className="text-text-3">—</span>}</span>
                      <RatingBar score={ep.score} className="justify-self-end" />
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-2 md:gap-3 lg:sticky lg:top-24 lg:self-start">
          {video ? (
            <section aria-label="Trailer" className="panel p-3 md:p-4">
              <TrailerPlayer
                videoKey={video.key}
                title={`${title.name} — ${video.name}`}
                fallbackLabel={title.name}
                lang={video.lang}
                highlightLang={edition.contentLang}
                duration={formatDuration(video.durationSec)}
                className="rounded-[14px]"
              />
              <div className="flex items-baseline justify-between gap-3 px-2 pt-3.5 pb-1.5">
                <p className="truncate text-sm font-medium">{video.name}</p>
                <p className="shrink-0 text-xs text-text-3">Official video · plays on YouTube</p>
              </div>
            </section>
          ) : null}

          {services.length > 0 ? (
            <section aria-labelledby="langs" className="panel p-5 md:p-6">
              <h2 id="langs" className="text-h3">
                Languages this season
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-text-3">As reported by each service. “not confirmed” = the service hasn&apos;t said — we don&apos;t guess.</p>
              <div className="-mx-1 mt-4 overflow-x-auto px-1">
                <table className="w-full min-w-[300px] text-left text-sm">
                  <thead>
                    <tr className="text-xs text-text-2">
                      <th scope="col" className="pr-3 pb-2 font-medium text-text-3">
                        Language
                      </th>
                      {services.map((s) => (
                        <th key={s.slug} scope="colgroup" colSpan={2} className="pr-3 pb-2 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <ServiceLogo {...s} size={20} />
                            {s.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                    <tr className="text-[11px] text-text-3">
                      <th />
                      {services.map((s) => (
                        <FragmentHeads key={s.slug} />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row) => (
                      <tr key={row.lang} className="border-t border-hairline">
                        <th scope="row" className="py-3 pr-3 font-medium">
                          <span className="flex items-center gap-2">
                            {row.lang === edition.contentLang ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-dub" /> : null}
                            <span>
                              {localLangName(row.lang)}
                              {localLangName(row.lang) !== langName(row.lang) ? <span className="ml-1.5 text-xs font-normal text-text-3">{langName(row.lang)}</span> : null}
                            </span>
                          </span>
                        </th>
                        {row.cells.map((c) => (
                          <CellPair key={c.serviceSlug} audio={c.audio} subtitle={c.subtitle} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {/* ── Previous / next season ── */}
      <nav aria-label="Seasons" className="wrap pt-12 pb-14 md:pt-20 md:pb-24">
        <div aria-hidden="true" className="rule" />
        <div className="flex flex-col gap-5 pt-5 md:flex-row md:items-center md:justify-between md:pt-6">
          <p className="max-w-xl text-[15px] leading-relaxed text-text-2">
            {isFinal ? (
              <>
                Season {season.number} is the latest season of {title.name}. Want to know when a new one — or its {code} dub — lands?
              </>
            ) : (
              <>Continue with season {season.number + 1}, or go back to the series overview.</>
            )}
          </p>
          {prev ? (
            <Link href={seriesHref} className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-medium text-text-2 hover:text-text md:self-auto">
              <ArrowLeftIcon className="size-4" />
              Back to {title.name}
            </Link>
          ) : null}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 md:mt-8 md:gap-3">
          {prev ? (
            <Link href={paths.season(edition, title.slug, prev.number)} className="card card-hover group flex min-h-[112px] flex-col justify-between p-4 md:min-h-[148px] md:p-6">
              <span className="flex items-center gap-2 text-[13px] text-text-2">
                <ArrowLeftIcon className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
                Previous
              </span>
              <span className="text-h2">Season {prev.number}</span>
            </Link>
          ) : (
            <Link href={seriesHref} className="card card-hover group flex min-h-[112px] min-w-0 flex-col justify-between p-4 md:min-h-[148px] md:p-6">
              <span className="flex items-center gap-2 text-[13px] text-text-2">
                <ArrowLeftIcon className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
                All seasons
              </span>
              <span className="text-h2 truncate">{title.name}</span>
            </Link>
          )}
          {isFinal ? (
            <div className={`card flex min-h-[112px] flex-col justify-between gap-4 p-4 md:min-h-[148px] md:p-6 `}>
              <span className="text-[13px] text-text-2">New season or {code} dub</span>
              <AlertButton title={savedTitle} alert="new_episode" label="Notify me" activeLabel="Notifying" variant="primary" className="self-start max-sm:w-full" />
            </div>
          ) : next ? (
            <Link
              href={paths.season(edition, title.slug, season.number + 1)}
              className={`card card-hover group flex min-h-[112px] flex-col items-end justify-between p-4 text-right md:min-h-[148px] md:p-6 `}
            >
              <span className="flex items-center gap-2 text-[13px] text-text-2">
                Next
                <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
              <span className="text-h2">Season {season.number + 1}</span>
            </Link>
          ) : null}
        </div>
      </nav>

      {/* Phones: the season's action stays one thumb away, above the tab bar. */}
      {best ? (
        <div className="glass fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 border-t border-hairline px-4 py-2.5 md:hidden">
          <WatchButton option={best} title={title.name} edition={edition} label={ctaLabel} className="w-full" />
        </div>
      ) : null}
    </div>
  );
}

const EP_COLS = "md:grid-cols-[48px_minmax(0,1fr)_116px_72px_56px]";
const EP_COLS_STILL = "md:grid-cols-[48px_132px_minmax(0,1fr)_116px_72px_56px]";

/** Edition-language status of the season's best offer — confirmed, or plainly "not confirmed". */
function SeasonLanguage({ best, edition }: { best: { audio: LangState; subtitle: LangState; quality: string | null } | undefined; edition: Edition }) {
  const code = edition.code.toUpperCase();
  if (!best) return <Pill>Not streaming in {edition.countryName}</Pill>;
  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2">
      {best.audio === "confirmed_yes" ? (
        <Pill tone="dub">
          <VolumeIcon className="size-3.5" />
          <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>
        </Pill>
      ) : best.audio === "confirmed_no" ? (
        <Pill>No {code} audio</Pill>
      ) : (
        <Pill tone="leaving">{code} audio not confirmed</Pill>
      )}
      {best.subtitle === "confirmed_yes" ? (
        <Pill>
          <CaptionsIcon className="size-3.5" />
          <span lang={edition.hreflang} className="text-text">
            {subTerm(edition.contentLang)}
          </span>
        </Pill>
      ) : best.subtitle === "confirmed_no" ? (
        <Pill>No {code} subtitles</Pill>
      ) : (
        <Pill tone="leaving">{code} subtitles not confirmed</Pill>
      )}
      {best.quality ? <Pill>{best.quality.toUpperCase()}</Pill> : null}
    </div>
  );
}

function FragmentHeads() {
  return (
    <>
      <th className="pr-2 pb-2 font-normal">Audio</th>
      <th className="pr-3 pb-2 font-normal">Subs</th>
    </>
  );
}

function CellPair({ audio, subtitle }: { audio: LangState; subtitle: LangState }) {
  return (
    <>
      <td className="py-3 pr-2">
        <LangMark status={audio} />
      </td>
      <td className="py-3 pr-3">
        <LangMark status={subtitle} />
      </td>
    </>
  );
}
