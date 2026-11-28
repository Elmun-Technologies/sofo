/**
 * Self-hosted daily backup (ADR 0003): consistent online copy of the SQLite file with better-sqlite3's
 * backup API (safe while the site is serving), integrity-checked, keeping the newest KEEP copies.
 *
 *   pnpm selfhost:backup            # → $SOFO_BACKUP_DIR (default: <db dir>/backups)/sofo-YYYY-MM-DD-HHmm.db
 *
 * Restore: stop writes, copy the chosen file over $SOFO_SQLITE_PATH (and delete its -wal/-shm), start again.
 * NOTE: backups live on the same volume as the database — they guard against corruption and bad ingests,
 * not against losing the server disk. Copy the backups folder off-server for that.
 */
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { SQLITE_PATH } from "../../lib/runtime";

const KEEP = Number(process.env.SOFO_BACKUP_KEEP ?? 7);

async function main() {
  if (!SQLITE_PATH) throw new Error("SOFO_SQLITE_PATH is not set");
  const dir = process.env.SOFO_BACKUP_DIR ?? join(dirname(SQLITE_PATH), "backups");
  mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  const target = join(dir, `sofo-${stamp}.db`);

  const src = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });
  try {
    await src.backup(target);
  } finally {
    src.close();
  }

  // The copy must open and pass SQLite's own check before older backups are rotated out.
  const copy = new Database(target, { readonly: true });
  try {
    const check = copy.pragma("integrity_check", { simple: true });
    const titles = (copy.prepare("SELECT count(*) AS n FROM title").get() as { n: number }).n;
    if (check !== "ok") throw new Error(`integrity_check failed for ${target}: ${String(check)}`);
    console.log(`[backup] ${target} ok (${(statSync(target).size / 1024 / 1024).toFixed(1)} MB, ${titles} titles)`);
  } catch (err) {
    rmSync(target, { force: true });
    throw err;
  } finally {
    copy.close();
    // Opening a WAL-mode copy leaves empty sidecar files behind; they would never be rotated out.
    for (const ext of ["-wal", "-shm"]) rmSync(target + ext, { force: true });
  }

  const files = readdirSync(dir)
    .filter((f) => /^sofo-\d{4}-\d{2}-\d{2}-\d{4}\.db$/.test(f))
    .sort(); // timestamp names sort chronologically
  for (const old of files.slice(0, Math.max(0, files.length - KEEP))) {
    rmSync(join(dir, old), { force: true });
    console.log(`[backup] removed old ${old}`);
  }
}

main().catch((err) => {
  console.error("[backup] failed:", err);
  process.exit(1);
});
