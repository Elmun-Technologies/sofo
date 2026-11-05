import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DubBadge, MutedBadge } from "@/components/ui/badges";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterCard } from "@/components/ui/poster-card";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { FollowPersonButton, ShareButton } from "@/components/value/person-actions";
import { hrefWith, one } from "@/components/value/filters";
import { InitialsAvatar, LangBadges, WatchTextLink } from "@/components/value/watch";
import { getEdition, paths } from "@/lib/editions";
import { formatDate } from "@/lib/format";
import { langName } from "@/lib/lang";
import { getPersonPage } from "@/lib/queries/value-pages";

export const revalidate = 3600;

/** Credit job → filter group. */
const GROUPS = [
  { key: "voice", label: "Voice", jobs: ["Voice"] },
  { key: "acting", label: "Acting", jobs: ["Actor", "Actress"] },
  { key: "directing", label: "Directing", jobs: ["Director"] },
  { key: "writing", label: "Writing", jobs: ["Writer", "Screenplay", "Story"] },
] as const;

function groupOf(job: string): string {
  return GROUPS.find((g) => (g.jobs as readonly string[]).includes(job))?.key ?? "other";
}

const ROLE: Record<string, string> = { voice: "Voice actor", acting: "Actor", directing: "Director", writing: "Writer", other: "Crew" };

const load = cache(async (lang: string, slug: string) => {
  const edition = getEdition(lang);
  if (!edition) return null;
  const data = await getPersonPage(edition, slug);
  return data ? { edition, data } : null;
});

export async function generateMetadata({ params }: PageProps<"/[lang]/kisi/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const r = await load(lang, slug);
  if (!r) return {};
  const { edition, data } = r;
  return {
    title: `${data.name} — where to watch movies and series in ${edition.countryName}`,
    description: `${data.name}'s filmography with the legal service and ${langName(edition.contentLang)} dub status for every title in ${edition.countryName}.`,
    // MVP: person pages are not indexed (CLAUDE.md page inventory #12).
    robots: { index: false, follow: true },
    alternates: { canonical: paths.person(edition, data.slug) },
  };
}

export default async function PersonPage({ params, searchParams }: PageProps<"/[lang]/kisi/[slug]">) {
  const { lang, slug } = await params;
  const r = await load(lang, slug);
  if (!r) notFound();
  const { edition: e, data } = r;
  const sp = await searchParams;
  const base = paths.person(e, data.slug);
  const code = e.code.toUpperCase();
  const dubLabel = `${langName(e.contentLang)} dub`;

  // One row per title (a person can have several jobs on the same title).
  const byTitle = new Map<number, (typeof data.credits)[number] & { jobs: string[]; groups: Set<string> }>();
  for (const c of data.credits) {
    const row = byTitle.get(c.card.id);
    if (row) {
      row.jobs.push(c.character ? `${c.character} (${c.job.toLowerCase()})` : c.job);
      row.groups.add(groupOf(c.job));
    } else {
      byTitle.set(c.card.id, { ...c, jobs: [c.character ? (c.job === "Voice" ? `${c.character} (voice)` : c.character) : c.job], groups: new Set([groupOf(c.job)]) });
    }
  }
  const titles = [...byTitle.values()].sort((a, b) => (b.card.year ?? 0) - (a.card.year ?? 0));
  const presentGroups = GROUPS.filter((g) => titles.some((t) => t.groups.has(g.key)));
  const groupParam = one(sp.is);
  const group = presentGroups.some((g) => g.key === groupParam) ? groupParam : undefined;
  const dubOnly = one(sp.dublaj) === "1";
  const current = { is: group, dublaj: dubOnly ? "1" : undefined };
  const filtered = titles.filter((t) => (!group || t.groups.has(group)) && (!dubOnly || t.card.dub));

  const dubCount = titles.filter((t) => t.card.dub).length;
  const streaming = titles.filter((t) => t.best).length;
  const roles = [...new Set(titles.flatMap((t) => [...t.groups]))].map((g) => ROLE[g] ?? g);
  const knownFor = [...titles].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const pronoun = "their";

  return (
    <>
      {/* ── Header ── */}
      <header className="mx-auto flex max-w-site flex-col items-center gap-4 px-4 pt-6 text-center md:flex-row md:items-start md:gap-7 md:px-7 md:pt-10 md:text-left">
        <span className="md:hidden">
          <InitialsAvatar name={data.name} size={104} />
        </span>
        <span className="hidden md:block">
          <InitialsAvatar name={data.name} size={160} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[52px]">{data.name}</h1>
          <p className="mt-1.5 text-[15px] text-text-2 md:mt-2 md:text-base md:text-text">
            {roles.join(" · ") || data.knownFor}
            {data.birthday ? <span className="hidden md:inline"> · Born {formatDate(data.birthday, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span> : null}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 md:justify-start">
            <MutedBadge>
              {titles.length} {titles.length === 1 ? "title" : "titles"}
            </MutedBadge>
            <span className="hidden md:inline-flex">
              <MutedBadge className="text-available!">{streaming} streaming in {e.countryName}</MutedBadge>
            </span>
            <DubBadge>
              {dubCount} with {dubLabel}
            </DubBadge>
          </div>
          <div className="mt-4 hidden gap-2 md:flex">
            <FollowPersonButton slug={data.slug} name={data.name} />
            <ShareButton title={data.name} />
          </div>
        </div>
      </header>

      {/* ── Known for (desktop) ── */}
      {knownFor.length > 0 ? (
        <section aria-labelledby="known" className="mx-auto hidden max-w-site px-7 pt-10 md:block">
          <h2 id="known" className="mb-4 text-2xl font-extrabold tracking-[-0.02em]">
            Known for
          </h2>
          <ul className="grid grid-cols-5 gap-4 lg:grid-cols-6">
            {knownFor.map((t) => (
              <li key={t.card.id}>
                <PosterCard card={t.card} edition={e} meta={[t.jobs[0], t.card.year].filter(Boolean).join(" · ")} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Filmography ── */}
      <section aria-labelledby="filmography" className="mx-auto max-w-site px-4 pt-6 pb-10 md:px-7 md:pt-12">
        <div className="flex flex-col">
        <div className="order-1 flex flex-col gap-3 md:order-2 md:mb-4 md:flex-row md:items-center">
          <ChipRow>
            <ChipLink href={hrefWith(base, current, { is: null })} active={!group} scroll={false}>
              All
            </ChipLink>
            {presentGroups.map((g) => (
              <ChipLink key={g.key} href={hrefWith(base, current, { is: g.key })} active={group === g.key} scroll={false}>
                {g.label}
              </ChipLink>
            ))}
            <span className="md:hidden">
              <ChipLink href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} scroll={false}>
                {code} dub only
              </ChipLink>
            </span>
          </ChipRow>
          <div className="ml-auto hidden md:block">
            <ChipLink href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} scroll={false}>
              {dubOnly ? "✓ " : ""}Only {dubLabel}
            </ChipLink>
          </div>
        </div>
        <div className="order-2 mt-5 mb-3 flex items-baseline gap-3 md:order-1 md:mt-0 md:mb-4">
          <h2 id="filmography" className="text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
            <span className="md:hidden">Where to watch {pronoun} work</span>
            <span className="hidden md:inline">Filmography — where to watch</span>
          </h2>
          <span className="hidden text-sm text-text-2 md:inline">
            {filtered.length} {filtered.length === 1 ? "title" : "titles"}
          </span>
        </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No titles for this filter">Try “All” or remove the dub filter.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2.5 md:gap-3">
            {filtered.map((t) => {
              const href = paths.title(e, t.card.type, t.card.slug);
              const role = t.jobs.join(", ");
              return (
                <li key={t.card.id} className="flex items-center gap-3.5 rounded-card bg-surface p-2.5 md:gap-5 md:px-3.5 md:py-3">
                  <span className="hidden w-12 shrink-0 text-[15px] font-bold text-text-2 tabular-nums md:block">{t.card.year ?? "—"}</span>
                  <Link href={href} className="w-[50px] shrink-0 md:w-10">
                    <PosterImage path={t.card.posterPath} alt={t.card.name} sizes="50px" className="rounded-[8px]!" />
                  </Link>
                  <div className="min-w-0 grow">
                    <Link href={href} className="block truncate text-base font-extrabold">
                      {t.card.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[13px] text-text-2 md:text-sm">
                      <span className="md:hidden">{[t.card.year, role, t.best?.serviceName].filter(Boolean).join(" · ")}</span>
                      <span className="hidden md:inline">{role}</span>
                    </p>
                    {t.best ? (
                      <div className="mt-1.5 md:hidden">
                        <LangBadges audio={t.best.audio} subtitle={t.best.subtitle} edition={e} prefix={t.best.type === "rent" || t.best.type === "buy" ? "Rent" : undefined} />
                      </div>
                    ) : null}
                  </div>
                  {t.best ? (
                    <div className="hidden shrink-0 items-center gap-4 md:flex">
                      <span className="inline-flex items-center gap-2">
                        <ServiceLogo slug={t.best.serviceSlug} name={t.best.serviceName} logoPath={t.best.logoPath} size={24} />
                        <span className="text-sm font-bold">{t.best.serviceName}</span>
                      </span>
                      <LangBadges audio={t.best.audio} subtitle={t.best.subtitle} edition={e} prefix={t.best.type === "rent" || t.best.type === "buy" ? "Rent" : undefined} />
                      <WatchTextLink option={t.best} title={t.card.name} edition={e} />
                    </div>
                  ) : (
                    <span className="hidden shrink-0 text-sm text-text-3 md:block">Not streaming in {e.countryName}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 md:hidden">
          <FollowPersonButton slug={data.slug} name={data.name} className="h-12 w-full" />
        </div>
        <p className="mt-6 text-xs text-text-3">We don&apos;t show photos of people — initials only. Credits from TMDB.</p>
      </section>
    </>
  );
}
