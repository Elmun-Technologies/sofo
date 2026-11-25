import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterIcon, XIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterGrid } from "@/components/ui/poster-grid";
import type { Edition } from "@/lib/editions";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getCatalog, parseCatalogParams, type CatalogFilters, type CatalogKind, type CatalogResult } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { cap, catalogHref, decadeLabel, isFiltered, OFFER_LABELS } from "./catalog-url";
import { FilterBar } from "./filter-bar";
import { FilterSheet } from "./filter-sheet";
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

  const active: { label: string; href: string; local?: boolean }[] = [];
  if (f.audio) active.push({ label: cap(f.audio === "dub" ? dubTerm(e.contentLang) : subTerm(e.contentLang)), href: to({ audio: undefined }), local: true });
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
    <div className="pb-14 md:pb-24">
      <header className="wrap pt-8 pb-6 md:pt-14 md:pb-9">
        <p lang="en" className="overline text-text-3">
          Catalogue
        </p>
        <h1 className="text-h1 mt-3 max-w-4xl">{h1}</h1>
        <p className="tnum mt-3 text-[15px] text-text-2 md:mt-4 md:text-base">{countLine}</p>
      </header>

      {/* Filters stay within reach while the grid scrolls (sits under the site header). */}
      <div className="sticky top-16 z-30 border-y border-hairline bg-ink/95 backdrop-blur-xl md:top-[120px]">
        <div className="wrap flex items-center gap-2 py-2.5 lg:py-3">
          <div className="hidden min-w-0 flex-1 lg:block">
            <FilterBar edition={e} base={base} filters={f} result={r} />
          </div>
          <FilterSheet
            base={base}
            filters={f}
            dubLabel={dubTerm(e.contentLang)}
            subLabel={subTerm(e.contentLang)}
            localLang={e.hreflang}
            services={r.services}
            genres={r.genres}
            activeCount={active.length}
            className="max-md:flex-1 lg:hidden"
          />
          <SortMenu base={base} filters={f} className="max-md:flex-1 md:ml-auto" />
        </div>
      </div>

      <div className="wrap">
        {active.length ? (
          <ul aria-label="Active filters" className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pt-4 md:mx-0 md:flex-wrap md:px-0 md:pt-5">
            {active.map((a) => (
              <li key={a.label} className="shrink-0">
                <Link
                  href={a.href}
                  scroll={false}
                  aria-label={`Remove filter ${a.label}`}
                  className="group/x inline-flex h-9 items-center gap-1.5 rounded-full bg-text/8 pr-2 pl-3.5 text-[13px] font-medium whitespace-nowrap text-text transition duration-200 ease-out hover:bg-text/14"
                >
                  <span lang={a.local ? e.hreflang : undefined}>{a.label}</span>
                  <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full text-text-3 transition-colors group-hover/x:bg-text/15 group-hover/x:text-text">
                    <XIcon className="size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link href={clearHref} scroll={false} className="inline-flex h-9 items-center px-2 text-[13px] font-medium whitespace-nowrap text-text-2 underline decoration-hairline-strong underline-offset-4 hover:decoration-current">
                Clear all
              </Link>
            </li>
          </ul>
        ) : null}

        <div className="pt-6 md:pt-8">
          {r.cards.length ? (
            <>
              <PosterGrid cards={r.cards} edition={e} />
              <Pagination page={f.page} pages={r.pages} href={(p) => catalogHref(base, { ...f, page: p })} />
            </>
          ) : (
            <EmptyState
              icon={<FilterIcon className="size-5" />}
              title="Nothing matches these filters"
              action={
                <ButtonLink href={base} variant="primary">
                  Reset filters
                </ButtonLink>
              }
            >
              Try removing a filter — or switch between dub and subtitles. We only list titles a legal service in {e.countryName}{" "}
              carries today.
            </EmptyState>
          )}
        </div>

        <section aria-labelledby="about-catalog" className="mt-14 md:mt-24">
          <div className="rule" />
          <div className="grid gap-3 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 md:pt-7">
            <h2 id="about-catalog" className="text-h3">
              About this catalogue
            </h2>
            <p className="max-w-3xl text-[15px] leading-relaxed text-text-2">{ABOUT[kind].replace("{country}", e.countryName)}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
