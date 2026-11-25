import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterIcon, XIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PosterGrid } from "@/components/ui/poster-grid";
import { PosterImage } from "@/components/ui/poster-image";
import type { Edition } from "@/lib/editions";
import { dubTerm, langName, subTerm } from "@/lib/lang";
import { getMegaMenu } from "@/lib/queries/mega-menu";
import { getCatalog, parseCatalogParams, type CatalogFilters, type CatalogKind, type CatalogResult } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { cap, catalogHref, decadeLabel, isFiltered, OFFER_LABELS, SORT_LABELS } from "./catalog-url";
import { FilterSidebar } from "./filter-sidebar";
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

  const menu = kind === "anime" ? null : await getMegaMenu(e);
  const genreTiles = menu ? (kind === "movies" ? menu.movie : menu.tv).slice(0, 8) : [];
  const listHref = kind === "movies" ? e.routes.movies : kind === "series" ? e.routes.series : e.routes.anime;

  return (
    <div className="pb-14 md:pb-24">
      <Breadcrumbs items={[{ name: "Home", href: e.routes.home }, { name: NOUN[kind].plural, href: listHref }, ...(r.genreName ? [{ name: r.genreName }] : [])]} />
      <header className="wrap pt-3 pb-5 md:pt-4 md:pb-6">
        <h1 className="text-h1 max-w-4xl">
          {h1} <span className="tnum align-middle text-base font-semibold tracking-normal text-text-3 md:text-lg">{n}</span>
        </h1>
        <p className="tnum mt-2 text-sm text-text-2">{countLine}</p>
      </header>

      {genreTiles.length ? (
        <nav aria-label="Genres" className="wrap pb-5 md:pb-7">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0 xl:grid-cols-8">
            {genreTiles.map((g) => {
              const on = f.genre === g.slug;
              return (
                <li key={g.slug} className="shrink-0">
                  <Link
                    href={to({ genre: on ? undefined : g.slug })}
                    scroll={false}
                    aria-current={on ? "true" : undefined}
                    className={`flex h-[66px] items-center gap-2.5 rounded-card py-2 pr-3 pl-2 transition-colors ${on ? "bg-text text-ink hover:text-ink" : "bg-surface hover:bg-surface-2 hover:text-text"}`}
                  >
                    <span className="w-[34px] shrink-0">
                      <PosterImage path={g.posterPath} alt="" sizes="34px" className="rounded-[6px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] leading-tight font-bold">{g.name}</span>
                      <span className={`tnum text-xs ${on ? "text-ink/60" : "text-text-3"}`}>{g.count}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {/* Mobile / tablet: filter sheet + sort stay within reach. */}
      <div className="sticky top-16 z-30 border-y border-hairline bg-ink/95 backdrop-blur-xl md:top-[120px] lg:hidden">
        <div className="wrap flex items-center gap-2 py-2.5">
          <FilterSheet
            base={base}
            filters={f}
            dubLabel={dubTerm(e.contentLang)}
            subLabel={subTerm(e.contentLang)}
            localLang={e.hreflang}
            services={r.services}
            genres={r.genres}
            activeCount={active.length}
            className="max-md:flex-1"
          />
          <SortMenu base={base} filters={f} className="max-md:flex-1 md:ml-auto" />
        </div>
      </div>

      <div className="wrap lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
        <div className="hidden lg:block">
          <FilterSidebar edition={e} base={base} filters={f} result={r} activeCount={active.length} clearHref={clearHref} />
        </div>
        <div className="min-w-0">
          <div className="hidden h-12 items-center gap-5 border-b border-hairline text-sm font-semibold lg:flex">
            <span className="text-text-3">Sort:</span>
            {(Object.keys(SORT_LABELS) as (keyof typeof SORT_LABELS)[]).map((k) => (
              <Link
                key={k}
                href={catalogHref(base, { ...f, sort: k, page: 1 })}
                scroll={false}
                aria-current={f.sort === k ? "true" : undefined}
                className={`relative flex h-full items-center ${f.sort === k ? "text-text after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-text" : "text-text-2 hover:text-text"}`}
              >
                {SORT_LABELS[k]}
              </Link>
            ))}
            <span className="tnum ml-auto text-text-3">
              {n} {noun}
            </span>
          </div>

        {active.length ? (
          <ul aria-label="Active filters" className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pt-4 md:mx-0 md:flex-wrap md:px-0">
            {active.map((a) => (
              <li key={a.label} className="shrink-0">
                <Link
                  href={a.href}
                  scroll={false}
                  aria-label={`Remove filter ${a.label}`}
                  className="group/x inline-flex h-9 items-center gap-1.5 rounded-full bg-surface pr-2 pl-3.5 text-[13px] font-semibold whitespace-nowrap text-text transition duration-200 ease-out hover:bg-surface-2"
                >
                  <span lang={a.local ? e.hreflang : undefined}>{a.label}</span>
                  <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full text-text-3 transition-colors group-hover/x:bg-ink group-hover/x:text-text">
                    <XIcon className="size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link href={clearHref} scroll={false} className="inline-flex h-9 items-center px-2 text-[13px] font-bold whitespace-nowrap text-orange-press hover:underline">
                Clear all
              </Link>
            </li>
          </ul>
        ) : null}

        <div className="pt-5 md:pt-6">
          {r.cards.length ? (
            <>
              <PosterGrid cards={r.cards} edition={e} dense />
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
        </div>
      </div>

      <div className="wrap">
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
