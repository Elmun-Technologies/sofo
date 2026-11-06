import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { safeEqual } from "@/lib/admin/auth";
import { applyMigrations, hasRealData, loadDemoData } from "@/lib/d1-setup";
import { DEMO_DATA } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * POST /api/setup  (Authorization: Bearer $SETUP_TOKEN)
 *   {"action":"migrate"}  apply pending D1 migrations
 *   {"action":"demo"}     migrate + load sample data (demo mode only, refuses if real data exists)
 * 404 when SETUP_TOKEN is not configured.
 */
export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  const vars = env as unknown as { DB?: D1Database; SETUP_TOKEN?: string };
  const token = vars.SETUP_TOKEN ?? process.env.SETUP_TOKEN;
  if (!token || !vars.DB) return new Response("Not found", { status: 404 });

  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!(await safeEqual(given, token))) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const db = vars.DB;
  const migrated = await applyMigrations(db);
  if (body.action === "migrate") return Response.json({ migrated });
  if (body.action === "demo") {
    if (!DEMO_DATA) return Response.json({ error: "demo mode is off" }, { status: 409 });
    if (await hasRealData(db)) return Response.json({ error: "database has ingested data; refusing to overwrite" }, { status: 409 });
    return Response.json({ migrated, demo: await loadDemoData(db) });
  }
  return Response.json({ error: 'action must be "migrate" or "demo"' }, { status: 400 });
}
