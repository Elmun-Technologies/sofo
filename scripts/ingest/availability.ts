/**
 * Availability ingest — Streaming Availability API v4 → Offer / OfferLanguage / AvailabilityEvent.
 *
 *   pnpm ingest:availability [-- --edition=tr --limit=50 --dry-run --file=data/titles.csv]
 *   pnpm ingest:availability -- --from-cache=.cache/sa/tr-… (snapshot from `pnpm ingest:catalog`, no API requests)
 *   pnpm ingest:availability -- --from-cache=latest      (newest crawl of the edition)
 *   pnpm ingest:availability -- --from-cache=latest --stale=5   (+ re-check 5 titles unchecked for 7+ days)
 *
 * Default title list: every title in the DB (metadata ingest first). Diff semantics:
 * docs/data-model.md §3. Idempotent: an unchanged snapshot writes no events and no offer changes;
 * only checkedAt is refreshed (that is the "checked" proof shown on pages).
 */
import { readFile } from "node:fs/promises";
import { db } from "../../lib/db";
import { ingestTitleAvailability } from "../../lib/ingest/apply";
import { normalizeShow } from "../../lib/ingest/normalize";
import { parseTitleCsv } from "../../lib/ingest/title-list";
import { editionCodes, getEdition } from "../../lib/editions";
import { SourceConfigError } from "../../lib/sources/http";
import { latestCacheDir, loadCachedShows } from "../../lib/ingest/cache";
import { pickStale } from "../../lib/ingest/stale";
import { getShow, isStreamingAvailabilityConfigured } from "../../lib/sources/streaming-availability";
import { withNodeDb } from "../../lib/db-node";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = has("dry-run");
const file = value("file");
const limit = Number(value("limit") ?? 0) || 0;
const editionCode = value("edition") ?? "tr";
const fromCache = value("from-cache");
/** Re-check up to N titles not checked for `--stale-days` (default 7) — see lib/ingest/stale.ts. */
const staleCount = Math.max(0, Number(value("stale") ?? 0) || 0);
const staleDays = Math.max(1, Number(value("stale-days") ?? 7) || 7);

const log = (...parts: unknown[]) => console.log("[availability]", ...parts);
const describe = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function main() {
  const edition = getEdition(editionCode);
  if (!edition) throw new Error(`unknown edition "${editionCode}" (live: ${editionCodes().join(", ")})`);
  if (fromCache) {
    // "latest" = newest crawl of this edition (used by the self-hosted daily refresh).
    const dir = fromCache === "latest" ? await latestCacheDir(".cache/sa", editionCode) : fromCache;
    await ingestFromCache(dir, edition.country);
    if (staleCount > 0) {
      if (!isStreamingAvailabilityConfigured()) log("stale sweep skipped: STREAMING_AVAILABILITY_API_KEY is not set");
      else await sweepStale(edition.country);
    }
    return;
  }
  if (!isStreamingAvailabilityConfigured()) {
    throw new SourceConfigError("STREAMING_AVAILABILITY_API_KEY is not set — add it to .env.local (never commit it)");
  }

  const rows = file
    ? parseTitleCsv(await readFile(file, "utf8"))
    : await db.title.findMany({ select: { tmdbId: true, type: true }, orderBy: { id: "asc" } });
  const list = limit > 0 ? rows.slice(0, limit) : rows;
  log(`${list.length} titles · edition ${edition.code} (${edition.country})${dryRun ? " · dry run" : ""}`);
  await ingestTitles(list, edition.country);
}

/** Oldest-checked titles with active offers, re-checked one by one (1 API request each). */
async function sweepStale(country: string) {
  const cutoff = new Date(Date.now() - staleDays * 86_400_000);
  const offers = await db.offer.findMany({
    where: { countryCode: country, isActive: true, seasonId: null, checkedAt: { lt: cutoff } },
    select: { titleId: true, checkedAt: true, title: { select: { tmdbId: true, type: true } } },
    orderBy: { checkedAt: "asc" },
    take: staleCount * 10,
  });
  const fresh = await db.offer.findMany({
    where: { countryCode: country, isActive: true, seasonId: null, titleId: { in: [...new Set(offers.map((o) => o.titleId))].slice(0, 80) }, checkedAt: { gte: cutoff } },
    select: { titleId: true, checkedAt: true, title: { select: { tmdbId: true, type: true } } },
  });
  const rows = [...offers, ...fresh].map((o) => ({ titleId: o.titleId, tmdbId: o.title.tmdbId, type: o.title.type, checkedAt: o.checkedAt }));
  const picked = pickStale(rows, cutoff, staleCount);
  log(`stale sweep: ${picked.length} titles not checked for ${staleDays}+ days`);
  if (picked.length) await ingestTitles(picked, country);
}

async function ingestTitles(list: { tmdbId: number; type: "movie" | "tv" }[], country: string) {
  const totals = { created: 0, updated: 0, deactivated: 0, unchanged: 0, events: 0, skipped: 0, failed: 0 };

  for (const [index, row] of list.entries()) {
    const label = `[${index + 1}/${list.length}] ${row.type} ${row.tmdbId}`;
    try {
      const show = await getShow({
        id: `${row.type === "movie" ? "movie" : "tv"}/${row.tmdbId}`,
        country,
        language: "en",
        granularity: "season",
      });
      if (!show) {
        totals.skipped++;
        log(`${label} not found in Streaming Availability — skipped`);
        continue;
      }
      const snapshot = normalizeShow(show, { country });
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
  const { shows, pages, rejected } = await loadCachedShows(dir);
  const list = limit > 0 ? shows.slice(0, limit) : shows;
  log(`${list.length} titles from ${pages} cached pages (${dir})${rejected ? ` · ${rejected} rejected` : ""}${dryRun ? " · dry run" : ""}`);

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
