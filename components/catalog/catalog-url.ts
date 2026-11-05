/** Catalog URL helpers — DB-free so client components (filter sheet) can use them. */
import type { CatalogFilters } from "@/lib/queries/catalog-pages";

/** Builds a catalog URL; defaults are omitted so the plain page stays canonical. */
export function catalogHref(base: string, f: Partial<CatalogFilters>): string {
  const q = new URLSearchParams();
  if (f.genre) q.set("genre", f.genre);
  if (f.service) q.set("service", f.service);
  if (f.audio) q.set("audio", f.audio);
  if (f.offer) q.set("offer", f.offer);
  if (f.decade != null) q.set("decade", String(f.decade));
  if (f.sort && f.sort !== "popular") q.set("sort", f.sort);
  if (f.page && f.page > 1) q.set("page", String(f.page));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** True when anything besides `page` is set — those combinations are noindex (PRD 6: curated only). */
export function isFiltered(f: CatalogFilters): boolean {
  return !!(f.genre || f.service || f.audio || f.offer || f.decade != null || f.sort !== "popular");
}

export const DECADES = [2020, 2010, 2000, 1990, 0] as const;
export const decadeLabel = (d: number) => (d === 0 ? "Before 1990" : `${d}s`);

export const OFFER_LABELS = { subscription: "Subscription", free: "Free", rent: "Rent", buy: "Buy" } as const;
export const SORT_LABELS = { popular: "Popular", newest: "Newest", top: "Top rated" } as const;

/** "türkçe dublaj" → "Türkçe dublaj" (labels in filter UI). */
export const cap = (s: string) => s.charAt(0).toLocaleUpperCase("tr") + s.slice(1);
