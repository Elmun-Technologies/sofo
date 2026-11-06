/**
 * D1 schema + demo data loader for deployed environments (ADR 0002). Remote D1 has no SQL console here,
 * so the protected /api/setup route applies migrations/*.sql (bundled) and, in demo mode, the sample data.
 * Uses the wrangler `d1_migrations` table, so `wrangler d1 migrations apply` and this route agree.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { DEMO_BUILT_AT, DEMO_DATE_COLUMNS, DEMO_SEED, DEMO_WIPE, MIGRATIONS } from "./generated/d1-bundle";

const CHUNK = 50;

/** exec() takes newline-separated, single-line statements; chunks keep each call small. */
async function execAll(db: D1Database, statements: string[]) {
  for (let i = 0; i < statements.length; i += CHUNK) await db.exec(statements.slice(i, i + CHUNK).join("\n"));
}

export async function applyMigrations(db: D1Database): Promise<string[]> {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);",
  );
  const done = new Set((await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>()).results.map((r) => r.name));
  const applied: string[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    await execAll(db, m.statements);
    await db.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(m.name).run();
    applied.push(m.name);
  }
  return applied;
}

/** Real (ingested) data present? Demo data is only ever loaded into a database without it. */
export async function hasRealData(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT count(*) AS n FROM offer WHERE source != 'manual'").first<{ n: number }>();
  return (row?.n ?? 0) > 0;
}

/** Replaces all rows with the bundled sample data, shifted so the newest check is "now". */
export async function loadDemoData(db: D1Database, now = new Date()): Promise<{ rows: number; shiftedSeconds: number }> {
  await execAll(db, DEMO_WIPE);
  await execAll(db, DEMO_SEED);
  const shift = Math.round((now.getTime() - new Date(DEMO_BUILT_AT).getTime()) / 1000);
  await execAll(
    db,
    DEMO_DATE_COLUMNS.map(
      ([t, c]) => `UPDATE "${t}" SET "${c}" = strftime('%Y-%m-%dT%H:%M:%fZ', "${c}", '${shift >= 0 ? "+" : ""}${shift} seconds') WHERE "${c}" IS NOT NULL;`,
    ),
  );
  return { rows: DEMO_SEED.length, shiftedSeconds: shift };
}
