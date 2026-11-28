/**
 * Age ratings (TMDB certifications) → one display form, "0+" … "18+", as ivi shows them.
 *
 * Source priority: the edition's own country first (RTÜK for TR), then US, GB, DE. Ratings are taken
 * as published by the rating body, only re-written as a minimum age; an unknown label is dropped
 * (no rating shown) rather than guessed.
 */

export type CountryRating = { country: string; rating: string };

const US: Record<string, number> = { G: 0, PG: 7, "PG-13": 13, R: 17, "NC-17": 18, "TV-Y": 0, "TV-G": 0, "TV-Y7": 7, "TV-PG": 7, "TV-14": 14, "TV-MA": 17 };
const GB: Record<string, number> = { U: 0, PG: 8, "12": 12, "12A": 12, "15": 15, "18": 18, R18: 18 };

/** Minimum age for one country's label, or null when the label is unknown. */
export function minimumAge(country: string, raw: string): number | null {
  const label = raw.trim();
  if (!label) return null;
  const c = country.toUpperCase();
  if (c === "US") return US[label.toUpperCase()] ?? null;
  if (c === "GB") return GB[label.toUpperCase()] ?? null;
  // TR (RTÜK / Akıllı İşaretler): "Genel İzleyici", "7+", "7A", "13+", "18+"; DE (FSK): "0", "6", "12", "16", "18".
  if (/^genel/i.test(label)) return 0;
  const n = /^(\d{1,2})\s*(\+|A)?$/i.exec(label);
  if (!n) return null;
  const age = Number(n[1]);
  return age >= 0 && age <= 21 ? age : null;
}

/** Picks the best-sourced rating; returns "13+" style or null. */
export function pickAgeRating(ratings: CountryRating[], editionCountry: string): string | null {
  const order = [editionCountry.toUpperCase(), "US", "GB", "DE"];
  for (const country of order) {
    for (const r of ratings) {
      if (r.country.toUpperCase() !== country) continue;
      const age = minimumAge(country, r.rating);
      if (age !== null) return `${age}+`;
    }
  }
  return null;
}
