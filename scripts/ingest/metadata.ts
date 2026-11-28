/**
 * Metadata ingest — TMDB → Title, TitleLocalization (tr/en), Season, official Video, Franchise.
 *
 *   pnpm ingest:metadata [-- --limit=50] [--dry-run] [--file=data/titles.csv] [--refresh-days=7] [--episode-seasons=3]
 *
 * Requires TMDB_API_KEY in .env.local (never in the repo). Idempotent: existing rows are updated.
 * --refresh-days=N   skip titles whose metadata was updated in the last N days (new titles always run),
 *                    so a growing list costs about (new + all/N) titles a day instead of all of them.
 * --episode-seasons=N  series: fetch episodes of the newest N aired seasons (1 request each, +1 when
 *                    TMDB has only generic local episode names). 0 = no episodes.
 */
import { readFile } from "node:fs/promises";
import { upsertTitleMetadata } from "../../lib/ingest/apply";
import { mapMovie, mapTv } from "../../lib/ingest/metadata";
import { parseTitleCsv } from "../../lib/ingest/title-list";
import { HttpError, SourceConfigError } from "../../lib/sources/http";
import { getMovie, getTv, getTvSeason, isTmdbConfigured } from "../../lib/sources/tmdb";
import { isGenericEpisodeName, mapEpisodes, type TitleMetadata } from "../../lib/ingest/metadata";
import { db } from "../../lib/db";
import { withNodeDb } from "../../lib/db-node";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = has("dry-run");
const file = value("file") ?? "data/titles.csv";
const limit = Number(value("limit") ?? 0) || 0;
const refreshDays = Math.max(0, Number(value("refresh-days") ?? 0) || 0);
const episodeSeasons = Math.max(0, Number(value("episode-seasons") ?? 3) || 0);

const log = (...parts: unknown[]) => console.log("[metadata]", ...parts);
const describe = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function main() {
  if (!isTmdbConfigured()) throw new SourceConfigError("TMDB_API_KEY is not set — add it to .env.local (never commit it)");

  const rows = parseTitleCsv(await readFile(file, "utf8"));
  let list = limit > 0 ? rows.slice(0, limit) : rows;
  let skipped = 0;
  if (refreshDays > 0) {
    const cutoff = new Date(Date.now() - refreshDays * 86_400_000);
    const fresh = await db.title.findMany({ where: { updatedAt: { gte: cutoff } }, select: { tmdbId: true, type: true } });
    const freshKeys = new Set(fresh.map((t) => `${t.tmdbId}:${t.type}`));
    const before = list.length;
    list = list.filter((r) => !freshKeys.has(`${r.tmdbId}:${r.type}`));
    skipped = before - list.length;
  }
  log(`${list.length} titles from ${file}${skipped ? ` (${skipped} updated in the last ${refreshDays} days skipped)` : ""}${dryRun ? " (dry run)" : ""}`);

  let ok = 0;
  let failed = 0;

  for (const [index, row] of list.entries()) {
    const label = `[${index + 1}/${list.length}] ${row.type} ${row.tmdbId}`;
    try {
      const meta =
        row.type === "movie"
          ? mapMovie(await getMovie(row.tmdbId, "tr-TR"), await getMovie(row.tmdbId, "en-US"))
          : await withEpisodes(mapTv(await getTv(row.tmdbId, "tr-TR"), await getTv(row.tmdbId, "en-US")));
      const result = await upsertTitleMetadata(meta, { dryRun });
      const name = meta.localizations[0]?.name ?? meta.originalTitle;
      const action = dryRun ? "would upsert" : result.created ? "created" : "updated";
      log(`${label} ${name} → ${action} (${result.localizations} loc, ${result.seasons} seasons, ${result.videos} videos${result.franchise ? `, collection ${result.franchise}` : ""})`);
      ok++;
    } catch (err) {
      failed++;
      const status = err instanceof HttpError ? `HTTP ${err.status} ` : "";
      console.error(`${label} FAILED: ${status}${describe(err)}`);
    }
  }

  log(`done: ${ok} ok, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

/** Adds episodes for the newest aired seasons; a failed season keeps its stored episodes. */
async function withEpisodes(meta: TitleMetadata): Promise<TitleMetadata> {
  if (episodeSeasons === 0) return meta;
  const now = Date.now();
  const aired = meta.seasons.filter((s) => s.airDate && s.airDate.getTime() <= now).slice(-episodeSeasons);
  for (const season of aired) {
    try {
      const tr = await getTvSeason(meta.tmdbId, season.number, "tr-TR");
      const local = tr.episodes ?? [];
      const en = local.some((e) => isGenericEpisodeName(e.name)) ? ((await getTvSeason(meta.tmdbId, season.number, "en-US")).episodes ?? []) : [];
      season.episodes = mapEpisodes(local, en);
    } catch (err) {
      console.error(`[metadata] tv ${meta.tmdbId} season ${season.number} episodes skipped: ${describe(err)}`);
    }
  }
  return meta;
}

withNodeDb(main)
  .catch((err) => {
    console.error(`[metadata] ${describe(err)}`);
    process.exitCode = 1;
  })
