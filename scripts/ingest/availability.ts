/**
 * Availability ingest — Streaming Availability API v4 → Offer / OfferLanguage / AvailabilityEvent.
 *
 *   pnpm ingest:availability [-- --edition=tr --limit=50 --dry-run --file=data/titles.csv]
 *   pnpm ingest:availability -- --from-cache=.cache/sa/tr-… (snapshot from `pnpm ingest:catalog`, no API requests)
 *
 * Default title list: every title in the DB (metadata ingest first). Diff semantics:
 * docs/data-model.md §3. Idempotent: an unchanged snapshot writes no events and no offer changes;
 * only checkedAt is refreshed (that is the "checked" proof shown on pages).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../../lib/db";
import { ingestTitleAvailability } from "../../lib/ingest/apply";
import { normalizeShow } from "../../lib/ingest/normalize";
import { parseTitleCsv } from "../../lib/ingest/title-list";
import { editionCodes, getEdition } from "../../lib/editions";
import { SourceConfigError } from "../../lib/sources/http";
import { getShow, isStreamingAvailabilityConfigured, parseShow, type SaShow } from "../../lib/sources/streaming-availability";
import { withNodeDb } from "../../lib/db-node";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = has("dry-run");
const file = value("file");
const limit = Number(value("limit") ?? 0) || 0;
const editionCode = value("edition") ?? "tr";
const fromCache = value("from-cache");

const log = (...parts: unknown[]) => console.log("[availability]", ...parts);
const describe = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function main() {
  const edition = getEdition(editionCode);
  if (!edition) throw new Error(`unknown edition "${editionCode}" (live: ${editionCodes().join(", ")})`);
  if (fromCache) return ingestFromCache(fromCache, edition.country);
  if (!isStreamingAvailabilityConfigured()) {
    throw new SourceConfigError("STREAMING_AVAILABILITY_API_KEY is not set — add it to .env.local (never commit it)");
  }

  const rows = file
    ? parseTitleCsv(await readFile(file, "utf8"))
    : await db.title.findMany({ select: { tmdbId: true, type: true }, orderBy: { id: "asc" } });
  const list = limit > 0 ? rows.slice(0, limit) : rows;
  log(`${list.length} titles · edition ${edition.code} (${edition.country})${dryRun ? " · dry run" : ""}`);

  const totals = { created: 0, updated: 0, deactivated: 0, unchanged: 0, events: 0, skipped: 0, failed: 0 };

  for (const [index, row] of list.entries()) {
    const label = `[${index + 1}/${list.length}] ${row.type} ${row.tmdbId}`;
    try {
      const show = await getShow({
        id: `${row.type === "movie" ? "movie" : "tv"}/${row.tmdbId}`,
        country: edition.country,
        language: "en",
        granularity: "show",
      });
      if (!show) {
        totals.skipped++;
        log(`${label} not found in Streaming Availability — skipped`);
        continue;
      }
      const snapshot = normalizeShow(show, { country: edition.country });
      if (!snapshot) {
        totals.skipped++;
        log(`${label} has no TMDB id in the response — skipped`);
        continue;
      }
      const result = await ingestTitleAvailability(snapshot, { dryRun });
      if (!result.titleId) {
        totals.skipped++;
        log(`${label} ${result.note}`);
        continue;
      }
      totals.created += result.created;
      totals.updated += result.updated;
      totals.deactivated += result.deactivated;
      totals.unchanged += result.unchanged;
      totals.events += result.events;
      if (dryRun || result.created + result.updated + result.deactivated + result.events > 0) {
        log(`${label} +${result.created} ~${result.updated} -${result.deactivated} · ${result.events} events · ${result.unchanged} unchanged`);
      }
    } catch (err) {
      totals.failed++;
      console.error(`${label} FAILED: ${describe(err)}`);
    }
  }

  log(`done: +${totals.created} ~${totals.updated} -${totals.deactivated} · ${totals.events} events · ${totals.unchanged} unchanged · ${totals.skipped} skipped · ${totals.failed} failed`);
  if (totals.failed) process.exitCode = 1;
}

/** Replays a cached catalogue crawl (raw API pages) through the same normalize → diff → apply path. */
async function ingestFromCache(dir: string, country: string) {
  const files = (await readdir(dir)).filter((f) => /^page-\d+\.json$/.test(f)).sort();
  if (files.length === 0) throw new Error(`no page-*.json files in ${dir} — run pnpm ingest:catalog first`);
  const shows = new Map<string, SaShow>();
  let rejected = 0;
  for (const f of files) {
    const page = JSON.parse(await readFile(path.join(dir, f), "utf8")) as { shows?: unknown[] };
    for (const raw of page.shows ?? []) {
      try {
        const show = parseShow(raw);
        shows.set(show.tmdbId ?? show.id, show);
      } catch {
        rejected++;
      }
    }
  }
  const list = limit > 0 ? [...shows.values()].slice(0, limit) : [...shows.values()];
  log(`${list.length} titles from ${files.length} cached pages (${dir})${rejected ? ` · ${rejected} rejected` : ""}${dryRun ? " · dry run" : ""}`);

  const totals = { created: 0, updated: 0, deactivated: 0, unchanged: 0, events: 0, skipped: 0, failed: 0 };
  for (const [index, show] of list.entries()) {
    const label = `[${index + 1}/${list.length}] ${show.tmdbId ?? show.id}`;
    try {
      const snapshot = normalizeShow(show, { country });
      if (!snapshot) {
        totals.skipped++;
        continue;
      }
      const result = await ingestTitleAvailability(snapshot, { dryRun });
      if (!result.titleId) {
        totals.skipped++;
        continue;
      }
      totals.created += result.created;
      totals.updated += result.updated;
      totals.deactivated += result.deactivated;
      totals.unchanged += result.unchanged;
      totals.events += result.events;
    } catch (err) {
      totals.failed++;
      console.error(`${label} FAILED: ${describe(err)}`);
    }
  }
  log(`done: +${totals.created} ~${totals.updated} -${totals.deactivated} · ${totals.events} events · ${totals.unchanged} unchanged · ${totals.skipped} skipped (no metadata yet) · ${totals.failed} failed`);
  if (totals.failed) process.exitCode = 1;
}

withNodeDb(main)
  .catch((err) => {
    console.error(`[availability] ${describe(err)}`);
    process.exitCode = 1;
  })
