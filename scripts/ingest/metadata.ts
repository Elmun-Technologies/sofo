/**
 * Metadata ingest — TMDB → Title, TitleLocalization (tr/en), Season, official Video, Franchise.
 *
 *   pnpm ingest:metadata [-- --limit=50] [--dry-run] [--file=data/titles.csv]
 *
 * Requires TMDB_API_KEY in .env.local (never in the repo). Idempotent: existing rows are updated.
 */
import { readFile } from "node:fs/promises";
import { upsertTitleMetadata } from "../../lib/ingest/apply";
import { mapMovie, mapTv } from "../../lib/ingest/metadata";
import { parseTitleCsv } from "../../lib/ingest/title-list";
import { HttpError, SourceConfigError } from "../../lib/sources/http";
import { getMovie, getTv, isTmdbConfigured } from "../../lib/sources/tmdb";
import { withNodeDb } from "../../lib/db-node";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = has("dry-run");
const file = value("file") ?? "data/titles.csv";
const limit = Number(value("limit") ?? 0) || 0;

const log = (...parts: unknown[]) => console.log("[metadata]", ...parts);
const describe = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function main() {
  if (!isTmdbConfigured()) throw new SourceConfigError("TMDB_API_KEY is not set — add it to .env.local (never commit it)");

  const rows = parseTitleCsv(await readFile(file, "utf8"));
  const list = limit > 0 ? rows.slice(0, limit) : rows;
  log(`${list.length} titles from ${file}${dryRun ? " (dry run)" : ""}`);

  let ok = 0;
  let failed = 0;

  for (const [index, row] of list.entries()) {
    const label = `[${index + 1}/${list.length}] ${row.type} ${row.tmdbId}`;
    try {
      const meta =
        row.type === "movie"
          ? mapMovie(await getMovie(row.tmdbId, "tr-TR"), await getMovie(row.tmdbId, "en-US"))
          : mapTv(await getTv(row.tmdbId, "tr-TR"), await getTv(row.tmdbId, "en-US"));
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

withNodeDb(main)
  .catch((err) => {
    console.error(`[metadata] ${describe(err)}`);
    process.exitCode = 1;
  })
