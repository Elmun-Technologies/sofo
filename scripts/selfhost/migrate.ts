/**
 * Self-hosted start-up step (ADR 0003, Dockerfile CMD): applies pending migrations to the SQLite file
 * at SOFO_SQLITE_PATH. In demo mode (SOFO_DEMO_DATA != 0) an empty database also gets the sample data.
 * Idempotent — runs on every container start.
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applyMigrations, loadDemoData } from "../../lib/d1-setup";
import { SQLITE_PATH } from "../../lib/runtime";
import { DEMO_DATA } from "../../lib/site";
import { openSqliteFile } from "../../lib/sqlite-file";

async function main() {
  if (!SQLITE_PATH) throw new Error("SOFO_SQLITE_PATH is not set");
  mkdirSync(dirname(SQLITE_PATH), { recursive: true });
  const { db, close } = openSqliteFile(SQLITE_PATH);
  try {
    const applied = await applyMigrations(db);
    console.log(`[selfhost] ${SQLITE_PATH}: ${applied.length ? `applied ${applied.join(", ")}` : "schema up to date"}`);
    const count = async () => (await db.prepare("SELECT count(*) AS n FROM title").first<{ n: number }>())?.n ?? 0;
    if (DEMO_DATA && (await count()) === 0) {
      const demo = await loadDemoData(db);
      console.log(`[selfhost] demo mode: loaded ${demo.rows} sample rows`);
    }
    const titles = await count();
    console.log(`[selfhost] titles in database: ${titles || "0 — run the ingest push (docs/HANDOFF.md)"}`);
  } finally {
    close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
