/**
 * Cached catalogue crawls (`pnpm ingest:catalog`): raw API pages in `<dir>/page-NNN.json`.
 * Node-only (fs) — used by the ingest scripts, never by the Worker.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseShow, type SaShow } from "../sources/streaming-availability";

/** Every show in a cached crawl, de-duplicated by TMDB id (first page wins); malformed shows are counted. */
export async function loadCachedShows(dir: string): Promise<{ shows: SaShow[]; pages: number; rejected: number }> {
  const files = (await readdir(dir)).filter((f) => /^page-\d+\.json$/.test(f)).sort();
  if (files.length === 0) throw new Error(`no page-*.json files in ${dir} — run pnpm ingest:catalog first`);
  const shows = new Map<string, SaShow>();
  let rejected = 0;
  for (const f of files) {
    const page = JSON.parse(await readFile(path.join(dir, f), "utf8")) as { shows?: unknown[] };
    for (const raw of page.shows ?? []) {
      try {
        const show = parseShow(raw);
        const key = show.tmdbId ?? show.id;
        if (!shows.has(key)) shows.set(key, show);
      } catch {
        rejected++;
      }
    }
  }
  return { shows: [...shows.values()], pages: files.length, rejected };
}

/** The newest crawl directory under a cache root (names sort by timestamp). */
export async function latestCacheDir(root: string, edition: string): Promise<string> {
  const dirs = (await readdir(root, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && d.name.startsWith(`${edition}-`))
    .map((d) => d.name)
    .sort();
  const last = dirs.at(-1);
  if (!last) throw new Error(`no ${edition}-* crawl in ${root} — run pnpm ingest:catalog first`);
  return path.join(root, last);
}
