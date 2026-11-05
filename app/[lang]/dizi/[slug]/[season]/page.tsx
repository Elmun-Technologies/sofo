import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { CheckedAt } from "@/components/ui/checked-at";
import { LangMark } from "@/components/ui/badges";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { AlertButton } from "@/components/value/alert-button";
import { TrailerPlayer } from "@/components/value/trailer-player";
import { LangBadges, RatingBar, ServiceLine, WatchButton, formatDuration } from "@/components/value/watch";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { formatDate, formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { langName, localLangName } from "@/lib/lang";
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

function statusText(s: LangState, what: string) {
  return s === "confirmed_yes" ? `${what} ✓` : s === "confirmed_no" ? `no ${what}` : `${what} not confirmed`;
}

export default async function SeasonPage({ params }: PageProps<"/[lang]/dizi/[slug]/[season]">) {
  const { lang, slug, season: segment } = await params;
  const r = await load(lang, slug, segment);
  if (!r) notFound();
  const { edition, data } = r;
  const { title, season, episodes, best, options, matrix, services, video } = data;
  const code = edition.code.toUpperCase();
  const seriesHref = paths.title(edition, "tv", title.slug);
  const isFinal = data.seasons.at(-1)?.number === season.number;
  const year = season.airDate ? new Date(season.airDate).getUTCFullYear() : null;
  const epCount = episodes.length || season.episodeCount;
  const meta = [year, epCount ? `${epCount} episodes` : null, isFinal ? "latest season" : null].filter(Boolean).join(" · ");
  const thumb = imageUrl(title.backdropPath, "w300");
  const checkedAt = options.map((o) => o.checkedAt).sort((a, b) => b.getTime() - a.getTime())[0];
  const ctaLabel = best ? `Watch S${season.number} on ${best.serviceName}` : null;
  const savedTitle = { id: title.id, type: "tv" as const, slug: title.slug, name: title.name, posterPath: title.posterPath, year: title.year };

  const seasonTabs = (
    <ChipRow className="mt-4 md:mt-5">
      {data.seasons.map((s) => (
        <ChipLink key={s.id} href={paths.season(edition, title.slug, s.number)} active={s.number === season.number} scroll={false}>
          Season {s.number}
        </ChipLink>
      ))}
      <ChipLink href={seriesHref}>All seasons</ChipLink>
    </ChipRow>
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: edition.routes.home },
          { name: "Series", href: edition.routes.series },
          { name: title.name, href: seriesHref },
          { name: `Season ${season.number}` },
        ]}
      />

      {/* ── Header ── */}
      <header className="mx-auto flex max-w-site flex-col gap-6 px-4 pt-5 md:px-7 md:pt-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 grow gap-4 md:gap-6">
          <PosterImage path={season.posterPath} alt={`${title.name} season ${season.number} poster`} priority sizes="120px" className="w-[76px] shrink-0 self-start md:w-[120px]" />
          <div className="min-w-0 grow">
            <Link href={seriesHref} className="text-sm font-semibold text-text-2 md:hidden">
              {title.name}
            </Link>
            <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] md:mt-3 md:text-[48px]">
              <span className="hidden md:inline">{title.name} — </span>Season {season.number}
            </h1>
            <p className="mt-1.5 text-[15px] text-text-2 md:mt-2 md:text-base">
              {meta}
              {season.score ? (
                <>
                  {" · "}
                  <span className="font-extrabold text-orange">TMDB {season.score.toFixed(1)}</span>
                </>
              ) : null}
            </p>
            <div className="hidden md:block">{seasonTabs}</div>
          </div>
        </div>

        {best ? (
          <aside className="hidden w-full max-w-[372px] shrink-0 rounded-card border border-line-soft bg-surface p-4 lg:block">
            <div className="flex items-start gap-3">
              <ServiceLogo slug={best.serviceSlug} name={best.serviceName} logoPath={best.logoPath} size={36} />
              <div className="min-w-0">
                <p className="font-extrabold">{best.serviceName}</p>
                <p className="mt-0.5 text-xs text-text-2">
                  {data.seasonLevel ? "Whole season" : "Series"} · {statusText(best.audio, `${code} audio`)} · {statusText(best.subtitle, `${code} subtitles`)}
                  {best.quality ? ` · ${best.quality.toUpperCase()}` : ""}
                </p>
              </div>
            </div>
            <WatchButton option={best} title={title.name} edition={edition} label={ctaLabel} size="sm" className="mt-3" />
          </aside>
        ) : null}
      </header>
      <div className="mx-auto max-w-site px-4 md:hidden">{seasonTabs}</div>

      {/* ── Episodes + side panel ── */}
      <div className="mx-auto grid max-w-site grid-cols-1 gap-8 px-4 pt-6 pb-10 md:px-7 md:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,584px)] lg:gap-7">
        <section aria-labelledby="episodes" className="min-w-0">
          <h2 id="episodes" lang="en" className="mb-3 text-xs font-extrabold tracking-[0.08em] text-text-2 uppercase">
            {epCount ? `${epCount} episodes` : "Episodes"}
            {season.airDate ? ` · from ${formatDate(season.airDate, { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </h2>
          {episodes.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-8 text-sm text-text-2">
              Episode list for this season isn&apos;t available yet. We add it as soon as the metadata source publishes it.
            </p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {episodes.map((ep) => {
                const still = imageUrl(ep.stillPath, "w300") ?? thumb;
                return (
                  <li key={ep.id} className="flex gap-3.5 rounded-card md:border md:border-line-soft md:bg-surface md:p-2.5">
                    <div className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-[10px] bg-surface-2 md:w-[148px]">
                      {still ? (
                        <Image src={still} alt="" fill sizes="148px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-orange-deep" />
                      )}
                      <span className="absolute bottom-1.5 left-1.5 rounded-chip bg-black/75 px-1.5 text-[11px] font-extrabold">E{ep.number}</span>
                    </div>
                    <div className="min-w-0 grow py-0.5">
                      <p className="text-xs text-text-2">
                        E{ep.number}
                        {ep.runtimeMin ? ` · ${formatRuntime(ep.runtimeMin)}` : ""}
                        {ep.airDate ? (
                          <>
                            {" · "}
                            <time dateTime={ep.airDate.toISOString().slice(0, 10)}>{formatDate(ep.airDate)}</time>
                          </>
                        ) : null}
                      </p>
                      <h3 className="mt-0.5 truncate text-base font-extrabold md:text-[17px]">{ep.name ?? `Episode ${ep.number}`}</h3>
                      <RatingBar score={ep.score} className="mt-1.5" />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Mobile CTA */}
          {best ? (
            <div className="mt-6 md:hidden">
              <WatchButton option={best} title={title.name} edition={edition} label={ctaLabel} className="h-[52px] w-full text-base" />
              <p className="mt-2 text-center text-xs text-text-2">
                {statusText(best.audio, `${code} audio`)} · {statusText(best.subtitle, `${code} subtitles`)}
                {best.quality ? ` · ${best.quality.toUpperCase()}` : ""}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          {video ? (
            <section className="rounded-panel border border-line-soft bg-surface p-3 md:p-4">
              <TrailerPlayer
                videoKey={video.key}
                title={`${title.name} — ${video.name}`}
                lang={video.lang}
                overlay={
                  <span className="absolute bottom-3 left-3 rounded-chip bg-black/75 px-2.5 py-1 text-xs font-extrabold">
                    {video.name}
                    {formatDuration(video.durationSec) ? ` ${formatDuration(video.durationSec)}` : ""}
                    {video.lang ? ` · ${video.lang.toUpperCase()}` : ""}
                  </span>
                }
              />
              <p className="mt-2 px-1 text-xs text-text-3">Official video · plays on YouTube</p>
            </section>
          ) : null}

          <section aria-labelledby="where" className="rounded-panel border border-line-soft bg-surface p-4 md:p-5">
            <h2 id="where" className="text-lg font-extrabold">
              Where to watch season {season.number}
            </h2>
            {!data.seasonLevel && options.length > 0 ? (
              <p className="mt-1 text-xs text-leaving">Season-level data not available — showing the series offer.</p>
            ) : null}
            {options.length === 0 ? (
              <p className="mt-3 text-sm text-text-2">Not on any legal service in {edition.countryName} right now.</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-line-soft">
                {options.map((o, i) => (
                  <li key={`${o.serviceSlug}-${o.type}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                    <ServiceLine option={o} />
                    <span className="ml-auto">
                      <WatchButton option={o} title={title.name} edition={edition} label="Watch" variant={o === best ? "primary" : "secondary"} size="sm" />
                    </span>
                    <div className="w-full">
                      <LangBadges audio={o.audio} subtitle={o.subtitle} edition={edition} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {checkedAt ? <CheckedAt at={checkedAt} className="mt-1 block" /> : null}
          </section>

          {services.length > 0 ? (
            <section aria-labelledby="langs" className="rounded-panel border border-line-soft bg-surface p-4 md:p-5">
              <h2 id="langs" className="text-lg font-extrabold">
                Languages this season
              </h2>
              <p className="mt-1 text-xs text-text-2">As reported by each service. “not confirmed” = the service hasn&apos;t said — we don&apos;t guess.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="text-xs text-text-2">
                      <th scope="col" className="py-2 pr-3 font-bold">
                        Language
                      </th>
                      {services.map((s) => (
                        <th key={s.slug} scope="colgroup" colSpan={2} className="py-2 pr-3 font-bold">
                          <span className="inline-flex items-center gap-1.5">
                            <ServiceLogo {...s} size={18} />
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
                      <tr key={row.lang} className={`border-t border-line-soft ${row.lang === edition.contentLang ? "bg-orange-deep/40" : ""}`}>
                        <th scope="row" className="py-2 pr-3 font-bold">
                          {localLangName(row.lang)}
                          {localLangName(row.lang) !== langName(row.lang) ? <span className="ml-1 text-xs font-medium text-text-3">{langName(row.lang)}</span> : null}
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

      {/* ── Footer strip ── */}
      <section className="mx-auto max-w-site px-4 pb-12 md:px-7">
        <div className="flex flex-col gap-4 rounded-panel border border-line-soft bg-surface p-5 sm:flex-row sm:items-center md:px-6">
          <p className="text-[15px] text-text">
            {isFinal ? (
              <>
                Season {season.number} is the latest season of {title.name}. Want to know when a new one — or its {code} dub — lands?
              </>
            ) : (
              <>Continue with season {season.number + 1}, or go back to the series overview.</>
            )}
          </p>
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <Link href={seriesHref} className="inline-flex h-11 items-center rounded-button border border-line px-4 text-sm font-extrabold text-text hover:border-text-3">
              ← Back to {title.name}
            </Link>
            {isFinal ? (
              <AlertButton title={savedTitle} alert="new_episode" label="Notify me" activeLabel="✓ Notifying" />
            ) : (
              <Link
                href={paths.season(edition, title.slug, season.number + 1)}
                className="inline-flex h-11 items-center rounded-button bg-surface-2 px-4 text-sm font-extrabold text-text hover:bg-line hover:text-text"
              >
                Season {season.number + 1} →
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function FragmentHeads() {
  return (
    <>
      <th className="pb-1.5 pr-2 font-semibold">Audio</th>
      <th className="pb-1.5 pr-3 font-semibold">Subs</th>
    </>
  );
}

function CellPair({ audio, subtitle }: { audio: LangState; subtitle: LangState }) {
  return (
    <>
      <td className="py-2 pr-2">
        <LangMark status={audio} />
      </td>
      <td className="py-2 pr-3">
        <LangMark status={subtitle} />
      </td>
    </>
  );
}
