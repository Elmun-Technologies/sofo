import { getCloudflareContext } from "@opennextjs/cloudflare";
import { safeEqual } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { ingestTitleAvailability, upsertTitleMetadata } from "@/lib/ingest/apply";
import { parseIngestBatch, PayloadError } from "@/lib/ingest/payload";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest  (Authorization: Bearer $INGEST_TOKEN) — production write path for ingested data.
 *   {"kind":"known","items":[{tmdbId,type}]}        → which titles already exist (skip their metadata)
 *   {"kind":"metadata","items":[TitleMetadata]}      → upsert titles (≤10 per request)
 *   {"kind":"availability","items":[SnapshotTitle]}  → diff + apply offers/events (≤25 per request)
 * The runner (scripts/ingest/push.ts) holds the API keys; the Worker only persists normalized data.
 * 404 when INGEST_TOKEN is not configured.
 */
export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  const token = (env as unknown as { INGEST_TOKEN?: string }).INGEST_TOKEN ?? process.env.INGEST_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });

  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!(await safeEqual(given, token))) return Response.json({ error: "unauthorized" }, { status: 401 });

  let batch;
  try {
    batch = parseIngestBatch(await req.json());
  } catch (err) {
    const message = err instanceof PayloadError ? err.message : "body must be JSON";
    return Response.json({ error: message }, { status: 400 });
  }

  if (batch.kind === "known") {
    // One scan instead of an IN list: D1 caps a statement at 100 bound values.
    const rows = await db.title.findMany({ select: { tmdbId: true, type: true } });
    const have = new Set(rows.map((r) => `${r.tmdbId}:${r.type}`));
    return Response.json({ known: batch.items.filter((k) => have.has(`${k.tmdbId}:${k.type}`)) });
  }

  const errors: { tmdbId: number; error: string }[] = [];

  if (batch.kind === "metadata") {
    let created = 0;
    let updated = 0;
    for (const meta of batch.items) {
      try {
        const result = await upsertTitleMetadata(meta);
        if (result.created) created++;
        else updated++;
      } catch (err) {
        errors.push({ tmdbId: meta.tmdbId, error: err instanceof Error ? err.message.slice(0, 300) : String(err) });
      }
    }
    return Response.json({ kind: "metadata", created, updated, errors }, { status: errors.length ? 207 : 200 });
  }

  const totals = { created: 0, updated: 0, deactivated: 0, unchanged: 0, events: 0, skipped: 0 };
  for (const snapshot of batch.items) {
    try {
      const result = await ingestTitleAvailability(snapshot);
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
      errors.push({ tmdbId: snapshot.tmdbId, error: err instanceof Error ? err.message.slice(0, 300) : String(err) });
    }
  }
  return Response.json({ kind: "availability", ...totals, errors }, { status: errors.length ? 207 : 200 });
}
