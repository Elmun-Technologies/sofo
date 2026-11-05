const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** Resolves a stored image path: local sample assets ("/sample/...") or TMDB file paths. */
export function imageUrl(path: string | null | undefined, size = "w342"): string | null {
  if (!path) return null;
  if (path.startsWith("/sample/")) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
