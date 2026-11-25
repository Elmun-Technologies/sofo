/**
 * Push a cached catalogue crawl to a deployed site — the production write path (no keys in the Worker).
 *
 *   pnpm ingest:push -- --target=https://sofo.tv [--from-cache=.cache/sa/tr-…] [--edition=tr] [--refresh-metadata] [--dry-run]
 *
 * Needs INGEST_TOKEN (the site's secret) and TMDB_API_KEY (metadata for titles the site does not have yet).
 * Steps: load the newest crawl → normalize every show → ask the site which titles it knows →
 * fetch TMDB metadata for the rest → POST metadata (10 per request) → POST availability (25 per request).
 * Spends no Streaming Availability quota: the crawl already holds the availability.
 */
import { latestCacheDir, loadCachedShows } from "../../lib/ingest/cache";
import { mapMovie, mapTv, type TitleMetadata } from "../../lib/ingest/metadata";
import { normalizeShow, type SnapshotTitle } from "../../lib/ingest/normalize";
import { chunk, MAX_BATCH, type TitleKey } from "../../lib/ingest/payload";
import { editionCodes, getEdition } from "../../lib/editions";
import { SourceConfigError } from "../../lib/sources/http";
import { getMovie, getTv, isTmdbConfigured } from "../../lib/sources/tmdb";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = has("dry-run");
const refreshMetadata = has("refresh-metadata");
const editionCode = value("edition") ?? "tr";
const target = (value("target") ?? process.env.INGEST_URL ?? "").replace(/\/+$/, "");

const log = (...parts: unknown[]) => console.log("[push]", ...parts);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** POST JSON with a bearer token; retries 429/5xx and network errors (3 attempts, backoff). */
async function post<T>(body: unknown): Promise<T> {
  const token = process.env.INGEST_TOKEN?.trim();
  if (!token) throw new SourceConfigError("INGEST_TOKEN is not set — the site's ingest secret");
  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${target}/api/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      if (!res.ok && res.status !== 207) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      return JSON.parse(text) as T;
    } catch (err) {
      last = err;
      if (attempt < 3) await sleep(1500 * attempt);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

type Errors = { errors: { tmdbId: number; error: string }[] };

async function main() {
  const edition = getEdition(editionCode);
  if (!edition) throw new Error(`unknown edition "${editionCode}" (live: ${editionCodes().join(", ")})`);
  if (!target && !dryRun) throw new Error("--target=https://… (or INGEST_URL) is required");

  const dir = value("from-cache") ?? (await latestCacheDir(".cache/sa", edition.code));
  const { shows, pages, rejected } = await loadCachedShows(dir);
  const snapshots = shows.map((s) => normalizeShow(s, { country: edition.country })).filter((s): s is SnapshotTitle => s !== null);
  log(`${snapshots.length} titles from ${pages} cached pages (${dir})${rejected ? ` · ${rejected} rejected` : ""} → ${target || "(dry run)"}`);

  // 1. Which titles does the site already have?
  const keys: TitleKey[] = snapshots.map((s) => ({ tmdbId: s.tmdbId, type: s.type }));
  const known = new Set<string>();
  if (!dryRun && !refreshMetadata) {
    for (const part of chunk(keys, MAX_BATCH.known)) {
      const res = await post<{ known: TitleKey[] }>({ kind: "known", items: part });
      for (const k of res.known) known.add(`${k.tmdbId}:${k.type}`);
    }
  }
  const missing = keys.filter((k) => !known.has(`${k.tmdbId}:${k.type}`));
  log(`metadata: ${known.size} known, ${missing.length} to fetch from TMDB`);

  // 2. TMDB metadata for the rest.
  if (missing.length && !isTmdbConfigured()) throw new SourceConfigError("TMDB_API_KEY is not set — needed for titles the site does not have yet");
  const metas: TitleMetadata[] = [];
  let metaFailed = 0;
  for (const k of missing) {
    try {
      metas.push(
        k.type === "movie"
          ? mapMovie(await getMovie(k.tmdbId, "tr-TR"), await getMovie(k.tmdbId, "en-US"))
          : mapTv(await getTv(k.tmdbId, "tr-TR"), await getTv(k.tmdbId, "en-US")),
      );
    } catch (err) {
      metaFailed++;
      console.error(`[push] TMDB ${k.type} ${k.tmdbId} FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (dryRun) {
    log(`dry run: would post ${metas.length} metadata in ${chunk(metas, MAX_BATCH.metadata).length} requests and ${snapshots.length} snapshots in ${chunk(snapshots, MAX_BATCH.availability).length} requests`);
    return;
  }

  // 3. Metadata first (availability needs the title rows), then availability.
  let failed = metaFailed;
  const meta = { created: 0, updated: 0 };
  for (const part of chunk(metas, MAX_BATCH.metadata)) {
    const res = await post<{ created: number; updated: number } & Errors>({ kind: "metadata", items: part });
    meta.created += res.created;
    meta.updated += res.updated;
    for (const e of res.errors) console.error(`[push] metadata ${e.tmdbId} FAILED: ${e.error}`);
    failed += res.errors.length;
  }
  log(`metadata: +${meta.created} created, ${meta.updated} updated`);

  const av = { created: 0, updated: 0, deactivated: 0, unchanged: 0, events: 0, skipped: 0 };
  const parts = chunk(snapshots, MAX_BATCH.availability);
  for (const [i, part] of parts.entries()) {
    const res = await post<typeof av & Errors>({ kind: "availability", items: part });
    for (const key of Object.keys(av) as (keyof typeof av)[]) av[key] += res[key];
    for (const e of res.errors) console.error(`[push] availability ${e.tmdbId} FAILED: ${e.error}`);
    failed += res.errors.length;
    log(`availability ${i + 1}/${parts.length}`);
  }
  log(`done: +${av.created} ~${av.updated} -${av.deactivated} offers · ${av.events} events · ${av.unchanged} unchanged · ${av.skipped} skipped · ${failed} failed`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`[push] ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
