import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterCard } from "@/components/ui/poster-card";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { hrefWith, one, ToggleChip } from "@/components/value/filters";
import { SectionHead } from "@/components/value/layout";
import { FollowPersonButton, ShareButton } from "@/components/value/person-actions";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { LangBadges, ServiceLine, WatchButton, WatchIconLink } from "@/components/value/watch";
import { getEdition, paths } from "@/lib/editions";
import { formatDate } from "@/lib/format";
import { langName } from "@/lib/lang";
import { getPersonPage } from "@/lib/queries/value-pages";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

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

  const roles = [...new Set(titles.flatMap((t) => [...t.groups]))].map((g) => ROLE[g] ?? g);
  const knownFor = [...titles].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const checkedAt = titles
    .map((t) => t.best?.checkedAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const roleTags = roles.length ? roles : data.knownFor ? [data.knownFor] : [];

  return (
    <>
      {/* ── Header: photo (or initials), name, roles ── */}
      <header className="wrap pt-7 md:pt-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex min-w-0 items-start gap-4 md:items-center md:gap-9">
            <PersonAvatar name={data.name} photoPath={data.photoPath} size={72} className="md:hidden" />
            <PersonAvatar name={data.name} photoPath={data.photoPath} size={168} className="max-md:hidden" />
            <div className="min-w-0">
              {roleTags.length ? (
                <p className="mb-3 flex flex-wrap gap-2 md:mb-5">
                  {roleTags.map((r) => (
                    <span key={r} className="tag">
                      {r}
                    </span>
                  ))}
                </p>
              ) : null}
              <h1 className="text-display">{data.name}</h1>
              {data.birthday ? (
                <p className="tnum mt-3 text-sm text-text-2 md:mt-4 md:text-[15px]">Born {formatDate(data.birthday, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2 max-md:hidden md:mt-7">
                <FollowPersonButton slug={data.slug} name={data.name} />
                <ShareButton title={data.name} />
              </div>
            </div>
          </div>

        </div>
        <div className="mt-7 grid grid-cols-2 gap-2 md:hidden">
          <FollowPersonButton slug={data.slug} name={data.name} />
          <ShareButton title={data.name} />
        </div>
      </header>

      {/* ── Known for ── */}
      {/* With one or two credits the filmography below already says it all. */}
      {titles.length >= 3 ? (
        <section aria-labelledby="known" className="wrap pt-12 md:pt-20">
          <SectionHead id="known" title="Known for" sub="Most popular titles on sofo" />
          <ul className="grid grid-cols-3 gap-x-3 gap-y-6 md:grid-cols-6 md:gap-x-4">
            {knownFor.map((t) => (
              <li key={t.card.id}>
                <PosterCard card={t.card} edition={e} meta={[t.jobs[0], t.card.year].filter(Boolean).join(" · ")} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Filmography ── */}
      <section aria-labelledby="filmography" className="wrap pt-12 pb-14 md:pt-20 md:pb-24">
        <SectionHead
          id="filmography"
          title="Filmography"
          sub={`Where to watch in ${e.countryName}`}
        />
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-5">
          <ChipRow className="min-w-0 max-md:flex-1">
            <ChipLink href={hrefWith(base, current, { is: null })} active={!group} scroll={false}>
              All
            </ChipLink>
            {presentGroups.map((g) => (
              <ChipLink key={g.key} href={hrefWith(base, current, { is: g.key })} active={group === g.key} scroll={false}>
                {g.label}
              </ChipLink>
            ))}
            <span className="md:hidden">
              <ToggleChip href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} dot="bg-dub">
                Only {dubLabel}
              </ToggleChip>
            </span>
          </ChipRow>
          <div className="shrink-0 max-md:hidden">
            <ToggleChip href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} dot="bg-dub">
              Only {dubLabel}
            </ToggleChip>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No titles for this filter">Try “All” or remove the dub filter.</EmptyState>
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {filtered.map((t) => {
              const href = paths.title(e, t.card.type, t.card.slug);
              const role = t.jobs.join(", ");
              const rentPrefix = t.best && (t.best.type === "rent" || t.best.type === "buy") ? "Rent" : undefined;
              return (
                <li
                  key={t.card.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-x-3.5 py-3.5 md:grid-cols-[64px_48px_minmax(0,1.3fr)_minmax(0,1fr)_112px] md:gap-x-6 md:py-4 xl:grid-cols-[80px_48px_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_112px]"
                >
                  <span className="tnum text-[22px] leading-none font-normal tracking-[-0.04em] text-text-2 max-md:hidden">{t.card.year ?? "—"}</span>
                  <Link href={href} tabIndex={-1} aria-hidden="true">
                    <PosterImage path={t.card.posterPath} alt="" sizes="48px" className="rounded-[8px]" />
                  </Link>
                  <div className="min-w-0">
                    <Link href={href} className="block truncate text-[15px] leading-6 font-medium md:text-[17px]">
                      {t.card.name}
                    </Link>
                    <p className="tnum truncate text-[13px] leading-5 text-text-3">
                      <span className="md:hidden">{t.card.year ? `${t.card.year} · ` : ""}</span>
                      {role}
                    </p>
                    {/* Below xl the language status sits under the name */}
                    <div className="mt-1 flex min-w-0 items-center gap-2 xl:hidden">
                      {t.best ? (
                        <>
                          <ServiceLogo slug={t.best.serviceSlug} name={t.best.serviceName} logoPath={t.best.logoPath} size={18} className="md:hidden" />
                          <LangBadges audio={t.best.audio} subtitle={t.best.subtitle} edition={e} prefix={rentPrefix} className="min-w-0" />
                        </>
                      ) : (
                        <span className="text-xs leading-5 text-text-3 md:hidden">Not streaming in {e.countryName}</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 max-md:hidden">
                    {t.best ? (
                      <ServiceLine option={t.best} size={32} note={<CheckedAt at={t.best.checkedAt} className="!text-[inherit] lowercase" />} />
                    ) : (
                      <span className="text-sm text-text-3">Not streaming in {e.countryName}</span>
                    )}
                  </div>

                  <div className="min-w-0 max-xl:hidden">{t.best ? <LangBadges audio={t.best.audio} subtitle={t.best.subtitle} edition={e} prefix={rentPrefix} /> : null}</div>

                  <div className="flex justify-end">
                    {t.best ? (
                      <>
                        <WatchButton option={t.best} title={t.card.name} edition={e} label="Watch" variant="secondary" size="sm" className="max-md:hidden" />
                        <WatchIconLink option={t.best} title={t.card.name} edition={e} className="md:hidden" />
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-6 text-xs leading-5 text-text-3">
          {checkedAt ? (
            <>
              Availability <CheckedAt at={checkedAt} className="lowercase" /> ·{" "}
            </>
          ) : null}
          Credits and photos from TMDB.
        </p>
      </section>
    </>
  );
}
