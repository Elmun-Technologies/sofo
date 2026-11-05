/** Small form-data validators for admin server actions (pure, unit-tested). */
export type ActionState = { ok: boolean; message: string } | null;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_TMDB_ID = 2_147_483_647;

export function str(fd: FormData, key: string, max = 5000): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Positive integer (≤ int4 max) or null. Accepts only plain digits. */
export function posInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const s = String(value).trim();
  if (!/^\d{1,10}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= MAX_TMDB_ID ? n : null;
}

/** Accepts a bare TMDB id or a TMDB URL (themoviedb.org/movie/123-name). */
export function parseTmdbInput(raw: string): { id: number; type?: "movie" | "tv" } | null {
  const s = raw.trim();
  const url = s.match(/themoviedb\.org\/(movie|tv)\/(\d+)/);
  if (url) {
    const id = posInt(url[2]);
    return id ? { id, type: url[1] as "movie" | "tv" } : null;
  }
  const id = posInt(s);
  return id ? { id } : null;
}
