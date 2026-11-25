import { safeEqual } from "@/lib/admin/auth";
import { applyMigrations, clearDemoData, hasRealData, loadDemoData, type SqlDb } from "@/lib/d1-setup";
import { runtimeEnv, SQLITE_PATH } from "@/lib/runtime";
import { DEMO_DATA } from "@/lib/site";
import { openSqliteFile } from "@/lib/sqlite-file";

export const dynamic = "force-dynamic";

/**
 * POST /api/setup  (Authorization: Bearer $SETUP_TOKEN)
 *   {"action":"migrate"}  apply pending D1 migrations
 *   {"action":"demo"}     migrate + load sample data (demo mode only, refuses if real data exists)
 *   {"action":"clear-demo"} migrate + delete the sample rows, keep base services (before the first real import)
 * 404 when SETUP_TOKEN is not configured.
 */
export async function POST(req: Request) {
  const vars = runtimeEnv() as { DB?: SqlDb; SETUP_TOKEN?: string };
  const token = vars.SETUP_TOKEN ?? process.env.SETUP_TOKEN;
  if (!token || (!vars.DB && !SQLITE_PATH)) return new Response("Not found", { status: 404 });

  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!(await safeEqual(given, token))) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  // Self-hosted (ADR 0003): a short-lived connection to the same SQLite file the app uses.
  const file = SQLITE_PATH ? openSqliteFile(SQLITE_PATH) : null;
  try {
    return await run(file?.db ?? vars.DB!, body.action);
  } finally {
    file?.close();
  }
}

async function run(db: SqlDb, action: string | undefined): Promise<Response> {
  const migrated = await applyMigrations(db);
  if (action === "migrate") return Response.json({ migrated });
  if (action === "demo") {
    if (!DEMO_DATA) return Response.json({ error: "demo mode is off" }, { status: 409 });
    if (await hasRealData(db)) return Response.json({ error: "database has ingested data; refusing to overwrite" }, { status: 409 });
    return Response.json({ migrated, demo: await loadDemoData(db) });
  }
  if (action === "clear-demo") {
    if (await hasRealData(db)) return Response.json({ error: "database has ingested data; nothing to clear" }, { status: 409 });
    return Response.json({ migrated, cleared: await clearDemoData(db) });
  }
  return Response.json({ error: 'action must be "migrate", "demo" or "clear-demo"' }, { status: 400 });
}
