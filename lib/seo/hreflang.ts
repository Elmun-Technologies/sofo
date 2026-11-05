import type { Metadata } from "next";

/** hreflang → path for the same entity across editions, e.g. { tr: "/tr/film/coco", en: "/en/movie/coco" }. */
export type HreflangPaths = Record<string, string>;

/**
 * Builds Next.js `alternates` for a page: canonical + every edition + x-default.
 * x-default points to the English page when it exists, otherwise to `fallback` (the edition picker).
 */
export function buildAlternates(
  canonical: string,
  paths: HreflangPaths,
  fallback = "/",
): NonNullable<Metadata["alternates"]> {
  return {
    canonical,
    languages: { ...paths, "x-default": paths.en ?? fallback },
  };
}
