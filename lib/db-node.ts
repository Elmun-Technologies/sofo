/**
 * Node scripts (seed, ingest, alerts, SEO sync): connect Prisma to the local D1 database that
 * `next dev` / `wrangler dev` use (.wrangler/state), or to the self-hosted SQLite file when
 * SOFO_SQLITE_PATH is set. Remote D1 is only reachable from the Worker.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { getPlatformProxy } from "wrangler";
import { createD1Client, createSqliteClient, setDb, type Db } from "./db";
import { SQLITE_PATH } from "./runtime";

export async function connectNodeDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  if (SQLITE_PATH) {
    // Self-hosted (ADR 0003): scripts run inside the container against the same file as the app.
    const client = createSqliteClient(SQLITE_PATH);
    setDb(client);
    return {
      db: client,
      close: async () => {
        setDb(undefined);
        await client.$disconnect();
      },
    };
  }
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath: "freebuff.wrangler.jsonc" });
  const client = createD1Client(proxy.env.DB);
  setDb(client);
  return {
    db: client,
    close: async () => {
      setDb(undefined);
      await client.$disconnect();
      await proxy.dispose();
    },
  };
}

/** Runs a script body with the local D1 client installed, then disposes it. */
export async function withNodeDb<T>(fn: () => Promise<T>): Promise<T> {
  const { close } = await connectNodeDb();
  try {
    return await fn();
  } finally {
    await close();
  }
}
