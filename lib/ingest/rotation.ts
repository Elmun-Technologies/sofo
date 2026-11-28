/**
 * Daily catalogue rotation — widens the title base inside the Streaming Availability quota.
 *
 * The head crawl (most popular this year) returns almost the same titles every day, so it adds only a
 * couple of new titles per run. The rotation spends a few extra pages on a different slice of the
 * catalogue each day; the cycle is 7 days, so every slice is re-crawled (and its titles re-checked)
 * once a week — inside the 7–9 day stale window of `ingest:availability --stale`.
 *
 * Budget (1 000 requests / month): head 12 + kids 3 + rotation 8 = 23 requests a day ≈ 700 a month,
 * plus at most `--stale` single-title checks a day.
 */
import type { SaOrderBy } from "../sources/streaming-availability";

export type RotationSlice = {
  /** Short label for logs */
  name: string;
  orderBy: SaOrderBy;
  showType?: "movie" | "series";
  /** ISO 639-1 original language (the edition's own language for "local originals") */
  originalLanguage?: string;
  genres?: string[];
  /** 0–100 */
  ratingMin?: number;
  /** Relative to the current year: -1 = since last year */
  yearsBack?: number;
};

/** One slice per weekday (UTC day number modulo the list length). Order matters only for variety. */
export function rotationSlices(editionLang: string): RotationSlice[] {
  return [
    { name: "top-rated movies", orderBy: "rating", showType: "movie", ratingMin: 70 },
    { name: "top-rated series", orderBy: "rating", showType: "series", ratingMin: 70 },
    { name: `${editionLang} originals`, orderBy: "popularity_alltime", originalLanguage: editionLang },
    { name: "all-time popular movies", orderBy: "popularity_alltime", showType: "movie" },
    { name: "all-time popular series", orderBy: "popularity_alltime", showType: "series" },
    { name: "trending this month", orderBy: "popularity_1month" },
    { name: "family & comedy", orderBy: "popularity_alltime", genres: ["family", "comedy"] },
  ];
}

/** Today's slice; `override` (0-based) pins a slice for manual runs. */
export function pickRotationSlice(editionLang: string, now: Date, override?: number): { index: number; slice: RotationSlice } {
  const slices = rotationSlices(editionLang);
  const day = Math.floor(now.getTime() / 86_400_000);
  const raw = override !== undefined && Number.isInteger(override) ? override : day;
  const index = ((raw % slices.length) + slices.length) % slices.length;
  return { index, slice: slices[index]! };
}
