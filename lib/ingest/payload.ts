/**
 * Wire format for the production ingest endpoint (POST /api/ingest). Pure: no DB, no network.
 *
 * API keys never reach the Worker: a trusted runner (GitHub Actions, a laptop) calls TMDB and the
 * Streaming Availability API, normalizes the results with the same pure code the local ingest uses,
 * and posts small batches. The Worker only persists them through lib/ingest/apply.ts.
 * JSON has no Date type, so date fields are revived here; anything malformed is rejected whole.
 */
import type { MetadataSeason, MetadataVideo, TitleMetadata } from "./metadata";
import type { SnapshotOffer, SnapshotTitle } from "./normalize";

/** Max items per request: keeps one Worker invocation well inside its time and CPU budget. */
export const MAX_BATCH = { metadata: 10, availability: 25, known: 2000 } as const;

export type TitleKey = { tmdbId: number; type: "movie" | "tv" };

export type IngestBatch =
  | { kind: "known"; items: TitleKey[] }
  | { kind: "metadata"; items: TitleMetadata[] }
  | { kind: "availability"; items: SnapshotTitle[] };

export class PayloadError extends Error {}

type Json = Record<string, unknown>;
const isRecord = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

function fail(msg: string): never {
  throw new PayloadError(msg);
}

function titleKey(v: unknown, where: string): TitleKey {
  if (!isRecord(v)) fail(`${where}: not an object`);
  const tmdbId = v.tmdbId;
  if (typeof tmdbId !== "number" || !Number.isInteger(tmdbId) || tmdbId <= 0) fail(`${where}: invalid tmdbId`);
  if (v.type !== "movie" && v.type !== "tv") fail(`${where}: type must be "movie" or "tv"`);
  return { tmdbId, type: v.type };
}

/** ISO string | null → Date | null; anything else is an error. */
function dateOrNull(v: unknown, where: string): Date | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") fail(`${where}: expected an ISO date string`);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) fail(`${where}: invalid date "${v}"`);
  return d;
}

function reviveMetadata(v: unknown, i: number): TitleMetadata {
  const where = `items[${i}]`;
  titleKey(v, where);
  const m = v as TitleMetadata & Json;
  if (typeof m.originalTitle !== "string" || !m.originalTitle) fail(`${where}: missing originalTitle`);
  if (!Array.isArray(m.localizations) || m.localizations.length === 0) fail(`${where}: missing localizations`);
  if (!Array.isArray(m.seasons) || !Array.isArray(m.videos) || !Array.isArray(m.genres)) fail(`${where}: seasons, videos and genres must be arrays`);
  return {
    ...m,
    seasons: m.seasons.map((s: MetadataSeason, j: number) => ({ ...s, airDate: dateOrNull(s.airDate, `${where}.seasons[${j}].airDate`) })),
    videos: m.videos.map((x: MetadataVideo, j: number) => ({ ...x, publishedAt: dateOrNull(x.publishedAt, `${where}.videos[${j}].publishedAt`) })),
  };
}

function reviveSnapshot(v: unknown, i: number): SnapshotTitle {
  const where = `items[${i}]`;
  const key = titleKey(v, where);
  const s = v as SnapshotTitle & Json;
  if (typeof s.countryCode !== "string" || !/^[A-Z]{2}$/.test(s.countryCode)) fail(`${where}: countryCode must be ISO alpha-2`);
  if (!Array.isArray(s.offers)) fail(`${where}: offers must be an array`);
  const offers = s.offers.map((o: SnapshotOffer, j: number): SnapshotOffer => {
    const w = `${where}.offers[${j}]`;
    if (!isRecord(o) || typeof o.serviceSlug !== "string" || typeof o.type !== "string" || typeof o.url !== "string") fail(`${w}: missing serviceSlug, type or url`);
    if (!Array.isArray(o.audio) || !Array.isArray(o.subtitle)) fail(`${w}: audio and subtitle must be arrays`);
    return { ...o, leavingAt: dateOrNull(o.leavingAt, `${w}.leavingAt`), availableSince: dateOrNull(o.availableSince, `${w}.availableSince`) };
  });
  return { ...key, countryCode: s.countryCode, offers };
}

export function parseIngestBatch(body: unknown): IngestBatch {
  if (!isRecord(body)) fail("body must be a JSON object");
  const { kind, items } = body;
  if (kind !== "known" && kind !== "metadata" && kind !== "availability") fail('kind must be "known", "metadata" or "availability"');
  if (!Array.isArray(items)) fail("items must be an array");
  if (items.length > MAX_BATCH[kind]) fail(`too many items: ${items.length} > ${MAX_BATCH[kind]} for "${kind}"`);
  if (kind === "known") return { kind, items: items.map((v, i) => titleKey(v, `items[${i}]`)) };
  if (kind === "metadata") return { kind, items: items.map(reviveMetadata) };
  return { kind, items: items.map(reviveSnapshot) };
}

/** Splits a list into request-sized batches. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
