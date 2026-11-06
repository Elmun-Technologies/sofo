/**
 * Prisma on Cloudflare D1 (ADR 0002). The client is bound to the request's `env.DB` binding;
 * Node scripts install their own client with `setDb()` (see lib/db-node.ts).
 * List columns are JSON text in SQLite; reads parse them back to string[] here, writes use `toList()`.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function parseList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || raw === "") return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Value to store in a JSON-list column. */
export function toList(values: readonly string[] | null | undefined): string {
  return JSON.stringify([...new Set(values ?? [])]);
}

/** Where-clause fragment: JSON-list column contains `value`. */
export function listHas(value: string) {
  return { contains: JSON.stringify(value) };
}

export function extendClient(client: PrismaClient) {
  return client.$extends({
    result: {
      title: { genres: { needs: { genres: true }, compute: (r) => parseList(r.genres) } },
      titleLocalization: { altNames: { needs: { altNames: true }, compute: (r) => parseList(r.altNames) } },
      country: { uiLangs: { needs: { uiLangs: true }, compute: (r) => parseList(r.uiLangs) } },
      alert: { kinds: { needs: { kinds: true }, compute: (r) => parseList(r.kinds) } },
    },
  });
}

export type Db = ReturnType<typeof extendClient>;

export function createD1Client(binding: D1Database): Db {
  return extendClient(new PrismaClient({ adapter: new PrismaD1(binding) }));
}

// One client per request (keyed by the request's ExecutionContext): Workers forbid sharing I/O objects
// across requests, so a module-level client is not safe.
const byRequest = new WeakMap<object, Db>();
let override: Db | undefined;

/** Node scripts / tests: use this client instead of the request binding. */
export function setDb(client: Db | undefined) {
  override = client;
}

export function getDb(): Db {
  if (override) return override;
  const { env, ctx } = getCloudflareContext();
  const binding = (env as { DB?: D1Database }).DB;
  if (!binding) throw new Error("D1 binding DB is not configured");
  const key = (ctx as object | undefined) ?? binding;
  let client = byRequest.get(key);
  if (!client) {
    client = createD1Client(binding);
    byRequest.set(key, client);
  }
  return client;
}

/** Request-scoped client behind a stable import (`db.title.findMany(...)`). */
export const db: Db = new Proxy({} as Db, {
  get(_, prop) {
    const client = getDb();
    const value: unknown = Reflect.get(client, prop);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
