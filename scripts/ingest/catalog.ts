/**
 * Catalogue crawl — Streaming Availability API v4 `/shows/search/filters` → title list + cached snapshots.
 *
 *   pnpm ingest:catalog [-- --edition=tr --pages=15 --kids-pages=3 --rotate=8 --out=data/titles.csv --cache=.cache/sa --dry-run]
 *   --rotate=N        N extra pages from today's rotation slice (lib/ingest/rotation.ts): top rated, local originals…
 *   --rotate-slice=K  pin slice K (0-based) instead of today's
 *
 * Why: the API quota is per request (1 000 a month on the current plan). /shows/{id} costs one request per
 * title; one catalogue page returns 20 titles with their full streaming options (audios/subtitles included).
 * The crawl writes every raw page to `<cache>/<edition>-<timestamp>/page-NNN.json`, so
 * `pnpm ingest:availability -- --from-cache=<dir>` ingests the same snapshot without another request.
 *
 * Order: crawl → `pnpm ingest:metadata` (TMDB, for the titles in the CSV) → availability from the cache.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { editionCodes, getEdition } from "../../lib/editions";
import { SERVICE_MAP, tmdbIdFrom } from "../../lib/ingest/normalize";
import { pickRotationSlice, type RotationSlice } from "../../lib/ingest/rotation";
import { parseTitleCsv, type TitleListRow } from "../../lib/ingest/title-list";
import { SourceConfigError } from "../../lib/sources/http";
import { isStreamingAvailabilityConfigured, searchCatalog } from "../../lib/sources/streaming-availability";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = has("dry-run");
const editionCode = value("edition") ?? "tr";
const pages = Math.max(1, Number(value("pages") ?? 15) || 15);
const kidsPages = Math.max(0, Number(value("kids-pages") ?? 3) || 0);
const rotatePages = Math.max(0, Number(value("rotate") ?? 0) || 0);
const rotateSlice = value("rotate-slice") !== undefined ? Number(value("rotate-slice")) : undefined;
const out = value("out") ?? "data/titles.csv";
const cacheRoot = value("cache") ?? ".cache/sa";

const log = (...parts: unknown[]) => console.log("[catalog]", ...parts);

async function main() {
  const edition = getEdition(editionCode);
  if (!edition) throw new Error(`unknown edition "${editionCode}" (live: ${editionCodes().join(", ")})`);
  if (!isStreamingAvailabilityConfigured()) {
    throw new SourceConfigError("STREAMING_AVAILABILITY_API_KEY is not set — add it to .env.local (never commit it)");
  }

  // Our service slugs → API catalog ids (reverse of SERVICE_MAP), only for the edition's services.
  const catalogs = Object.entries(SERVICE_MAP)
    .filter(([, slug]) => edition.coreServices.includes(slug))
    .map(([apiId]) => apiId);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const cacheDir = path.join(cacheRoot, `${edition.code}-${stamp}`);
  if (!dryRun) await mkdir(cacheDir, { recursive: true });
  const rotation = rotatePages > 0 ? pickRotationSlice(edition.contentLang, new Date(), rotateSlice) : null;
  log(
    `${edition.code} (${edition.country}) · catalogs ${catalogs.join(", ")} · ${pages} pages + ${kidsPages} animation pages` +
      (rotation ? ` + ${rotatePages} rotation pages (slice ${rotation.index}: ${rotation.slice.name})` : "") +
      (dryRun ? " · dry run" : ""),
  );

  const found: TitleListRow[] = [];
  let pageNo = 0;
  let requests = 0;

  const crawl = async (label: string, count: number, filters: Omit<RotationSlice, "name"> | { genres?: string[] } = {}) => {
    const f = filters as Partial<RotationSlice>;
    let cursor: string | null = null;
    for (let i = 0; i < count; i++) {
      // Season granularity: series pages also carry per-season options (same request cost).
      const page = await searchCatalog({
        country: edition.country,
        catalogs,
        cursor,
        granularity: "season",
        genres: f.genres,
        orderBy: f.orderBy,
        showType: f.showType,
        originalLanguage: f.originalLanguage,
        ratingMin: f.ratingMin,
        yearMin: f.yearsBack !== undefined ? new Date().getUTCFullYear() + f.yearsBack : undefined,
      });
      requests++;
      pageNo++;
      for (const show of page.shows) {
        const id = tmdbIdFrom(show.tmdbId);
        if (id) found.push({ tmdbId: id, type: show.showType === "movie" ? "movie" : "tv" });
      }
      if (!dryRun) await writeFile(path.join(cacheDir, `page-${String(pageNo).padStart(3, "0")}.json`), JSON.stringify({ shows: page.rawShows }));
      log(`${label} page ${i + 1}/${count}: ${page.shows.length} shows${page.rejected ? `, ${page.rejected} rejected` : ""}`);
      if (!page.hasMore || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
  };

  await crawl("popular", pages);
  if (kidsPages > 0) await crawl("animation", kidsPages, { genres: ["animation"] });
  if (rotation) {
    // The rotation only widens coverage: a rejected slice must not stop the daily refresh.
    try {
      await crawl(rotation.slice.name, rotatePages, rotation.slice);
    } catch (err) {
      console.error(`[catalog] rotation slice "${rotation.slice.name}" failed, continuing without it: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Merge with the existing list (curated rows keep their place), duplicates dropped.
  let existing: TitleListRow[] = [];
  try {
    existing = parseTitleCsv(await readFile(out, "utf8"));
  } catch {
    existing = [];
  }
  const seen = new Set(existing.map((r) => `${r.tmdbId}:${r.type}`));
  const added = found.filter((r) => {
    const key = `${r.tmdbId}:${r.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const rows = [...existing, ...added];

  const csv = [
    "# Title watchlist for ingest — one `tmdb_id,type` per line (`movie` | `tv`).",
    `# Built by pnpm ingest:catalog (${edition.code}, ${new Date().toISOString().slice(0, 10)}) from the services' TR catalogues, most popular first.`,
    "tmdb_id,type",
    ...rows.map((r) => `${r.tmdbId},${r.type}`),
    "",
  ].join("\n");
  if (!dryRun) await writeFile(out, csv);

  log(`done: ${requests} API requests · ${found.length} shows · ${added.length} new titles · ${rows.length} in ${out}${dryRun ? " (not written)" : ""}`);
  if (!dryRun) log(`snapshot cached in ${cacheDir} → pnpm ingest:availability -- --from-cache=${cacheDir}`);
}

main().catch((err) => {
  console.error(`[catalog] ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
