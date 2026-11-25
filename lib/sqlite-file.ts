/**
 * Self-hosted SQLite (ADR 0003): a D1-shaped wrapper over better-sqlite3 so lib/d1-setup.ts (migrations,
 * demo load/clear) runs unchanged on a file database.
 */
import type BetterSqlite3 from "better-sqlite3";
import type { SqlDb, SqlStatement } from "./d1-setup";
import { nodeRequire } from "./runtime";

export function openSqliteFile(path: string): { db: SqlDb; close: () => void } {
  const Database = nodeRequire<typeof BetterSqlite3>("better-sqlite3");
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  const statement = (sql: string, params: unknown[] = []): SqlStatement => ({
    bind: (...values) => statement(sql, values),
    all: async <T>() => ({ results: sqlite.prepare(sql).all(...params) as T[] }),
    first: async <T>() => (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
    run: async () => sqlite.prepare(sql).run(...params),
  });
  return {
    db: { exec: async (sql) => void sqlite.exec(sql), prepare: (sql) => statement(sql) },
    close: () => sqlite.close(),
  };
}
