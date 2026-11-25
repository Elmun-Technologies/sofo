/**
 * Stale sweep (2026-11-25): the daily catalogue crawl only sees the currently popular pages, so a title that
 * drops out of them is never re-checked — if it left the service, its offer would stay "active" forever.
 * Each run re-checks a few of the oldest-checked titles one by one (/shows/{id}, 1 request each); a title
 * the service no longer carries then gets its offers deactivated by the normal diff.
 */
export type StaleRow = { titleId: number; tmdbId: number; type: "movie" | "tv"; checkedAt: Date };

/** Oldest-checked titles first, one row per title, only those last checked before `cutoff`. */
export function pickStale(rows: StaleRow[], cutoff: Date, limit: number): StaleRow[] {
  const newest = new Map<number, StaleRow>();
  for (const r of rows) {
    const cur = newest.get(r.titleId);
    if (!cur || r.checkedAt > cur.checkedAt) newest.set(r.titleId, r);
  }
  return [...newest.values()]
    .filter((r) => r.checkedAt < cutoff)
    .sort((a, b) => a.checkedAt.getTime() - b.checkedAt.getTime() || a.titleId - b.titleId)
    .slice(0, Math.max(0, limit));
}
