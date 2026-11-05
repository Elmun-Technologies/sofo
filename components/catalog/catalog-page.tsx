import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterGrid } from "@/components/ui/poster-grid";
import type { Edition } from "@/lib/editions";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getCatalog, parseCatalogParams, type CatalogFilters, type CatalogKind, type CatalogResult } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { cap, catalogHref, decadeLabel, isFiltered, OFFER_LABELS } from "./catalog-url";
import { FilterSheet } from "./filter-sheet";
import { FilterSidebar } from "./filter-sidebar";
import { Pagination } from "./pagination";
import { SortMenu } from "./sort-menu";

type SearchParams = Record<string, string | string[] | undefined>;

const NOUN: Record<CatalogKind, { plural: string; one: string }> = {
  movies: { plural: "Movies", one: "movie" },
  series: { plural: "Series", one: "series" },
  anime: { plural: "Anime", one: "anime title" },
};

const ABOUT: Record<CatalogKind, string> = {
  movies:
    "Every movie you can watch legally in {country}, with the services that carry it and — where the service confirms it — Turkish dub and subtitles. Tick a service or an audio option to see only what you can actually watch tonight.",
  series:
    "Series streaming legally in {country}. We show which service carries each show and whether Turkish audio or subtitles are confirmed by the service — never guessed. Season-level language details live on each series page.",
  anime:
    "Japanese animation on legal services in {country}. Many anime come with Turkish subtitles first and a Turkish dub later — filter by audio to see which is confirmed today on each service.",
};

/** H1 / <title> from the active filters, e.g. "Animation movies with Turkish dub on Netflix". */
function heading(e: Edition, kind: CatalogKind, f: CatalogFilters, r: Pick<CatalogResult, "genreName" | "services">): string {
  const noun = NOUN[kind].plural;
  let h = r.genreName ? `${r.genreName} ${kind === "anime" ? "anime" : noun.toLowerCase()}` : noun;
  if (f.audio) h += ` with ${langName(e.contentLang)} ${f.audio === "dub" ? "dub" : "subtitles"}`;
  const service = r.services.find((s) => s.slug === f.service);
  if (service) h += ` on ${service.name}`;
  if (f.decade != null) h += f.decade === 0 ? " before 1990" : ` from the ${f.decade}s`;
  if (f.offer) h += f.offer === "free" ? " — free" : f.offer === "subscription" ? "" : ` to ${f.offer}`;
  if (!isFiltered(f)) h = `${noun} to watch in ${e.countryName}`;
  return h;
}

export async function catalogMetadata(e: Edition, kind: CatalogKind, base: string, sp: SearchParams): Promise<Metadata> {
  const f = parseCatalogParams(e, sp);
  const r = await getCatalog(e, kind, f);
  const filtered = isFiltered(f);
  const title = heading(e, kind, f, r) + (f.page > 1 ? ` — page ${f.page}` : "");
  // Plain pages (incl. ?page=N) are canonical to themselves; filtered combinations are noindex.
  const canonical = filtered ? base : catalogHref(base, { page: f.page });
  return {
    title,
    description: `${r.total.toLocaleString("en-US")} ${kind === "movies" ? "movies" : kind === "series" ? "series" : "anime titles"} on ${r.serviceCount} legal services in ${e.countryName}, with ${dubTerm(e.contentLang)} and ${subTerm(e.contentLang)} confirmed by each service. Updated daily.`,
    alternates: buildAlternates(canonical, { [e.hreflang]: canonical }),
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export async function CatalogPage({ edition: e, kind, base, searchParams }: { edition: Edition; kind: CatalogKind; base: string; searchParams: SearchParams }) {
  const f = parseCatalogParams(e, searchParams);
  const r = await getCatalog(e, kind, f);
  if (f.page > r.pages) notFound();
  const h1 = heading(e, kind, f, r);
  const to = (patch: Partial<CatalogFilters>) => catalogHref(base, { ...f, ...patch, page: 1 });

  const active: { label: string; href: string }[] = [];
  if (f.audio) active.push({ label: cap(f.audio === "dub" ? dubTerm(e.contentLang) : subTerm(e.contentLang)), href: to({ audio: undefined }) });
  if (f.service) active.push({ label: r.services.find((s) => s.slug === f.service)?.name ?? f.service, href: to({ service: undefined }) });
  if (r.genreName) active.push({ label: r.genreName, href: to({ genre: undefined }) });
  if (f.offer) active.push({ label: OFFER_LABELS[f.offer], href: to({ offer: undefined }) });
  if (f.decade != null) active.push({ label: decadeLabel(f.decade), href: to({ decade: undefined }) });
  const clearHref = catalogHref(base, { sort: f.sort });

  const noun = r.total === 1 ? NOUN[kind].one : kind === "movies" ? "movies" : kind === "series" ? "series" : "anime titles";
  const n = r.total.toLocaleString("en-US");
  const serviceName = r.services.find((s) => s.slug === f.service)?.name;
  const countLine =
    r.total === 0
      ? `0 ${noun} in ${e.countryName}`
      : serviceName
        ? `${n} ${noun} on ${serviceName} in ${e.countryName}`
        : `${n} ${noun} on ${r.serviceCount} service${r.serviceCount === 1 ? "" : "s"} in ${e.countryName}`;

  return (
    <div className="mx-auto max-w-site px-4 pt-5 pb-10 md:px-7 md:pt-8">
      <header>
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] md:text-[44px]">{h1}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-3 md:mt-4">
          <p className="text-sm text-text-2 md:text-[15px]">{countLine}</p>
          {active.length ? (
            <ul className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:w-auto md:flex-wrap md:px-0">
              {active.map((a) => (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    scroll={false}
                    aria-label={`Remove filter ${a.label}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-chip bg-white px-3 text-[13px] font-bold whitespace-nowrap text-ink hover:text-ink"
                  >
                    {a.label} <span aria-hidden="true">×</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href={clearHref} scroll={false} className="inline-flex h-8 items-center px-1 text-[13px] font-bold whitespace-nowrap text-text-2">
                  Clear all
                </Link>
              </li>
            </ul>
          ) : null}
          <SortMenu base={base} filters={f} className="ml-auto hidden lg:block" />
        </div>
        <div className="mt-4 flex gap-2.5 lg:hidden">
          <FilterSheet
            base={base}
            filters={f}
            dubLabel={dubTerm(e.contentLang)}
            subLabel={subTerm(e.contentLang)}
            services={r.services}
            genres={r.genres}
            activeCount={active.length}
          />
          <SortMenu base={base} filters={f} className="grow [&>summary]:w-full" />
        </div>
      </header>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <FilterSidebar edition={e} base={base} filters={f} result={r} />
        </aside>
        <div>
          {r.cards.length ? (
            <>
              <PosterGrid cards={r.cards} edition={e} dense />
              <Pagination page={f.page} pages={r.pages} href={(p) => catalogHref(base, { ...f, page: p })} />
            </>
          ) : (
            <EmptyState
              title="Nothing matches these filters"
              action={
                <ButtonLink href={base} variant="secondary">
                  Reset filters
                </ButtonLink>
              }
            >
              Try removing a filter — or switch between dub and subtitles. We only list titles a legal service in {e.countryName}{" "}
              carries today.
            </EmptyState>
          )}
          <p className="mt-10 max-w-4xl text-[15px] leading-relaxed text-text-2">{ABOUT[kind].replace("{country}", e.countryName)}</p>
        </div>
      </div>
    </div>
  );
}
