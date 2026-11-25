/**
 * Two runtimes (ADR 0003): Cloudflare Workers + D1 (Freebuff Sites), or self-hosted Node (Docker/Coolify)
 * with a SQLite file. `SOFO_SQLITE_PATH` selects the self-hosted one.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const SQLITE_PATH = process.env.SOFO_SQLITE_PATH || null;
export const SELF_HOSTED = SQLITE_PATH !== null;

/** Secrets/vars: process.env when self-hosted, the Worker env (bindings + secrets) on Cloudflare. */
export function runtimeEnv(): Record<string, unknown> {
  if (SELF_HOSTED) return process.env;
  return getCloudflareContext().env as unknown as Record<string, unknown>;
}

/**
 * Loads a Node-only package at runtime, invisible to the bundler — the Workers build must never pull in
 * native modules such as better-sqlite3. Only called when SELF_HOSTED.
 */
export function nodeRequire<T>(id: string): T {
  const { createRequire } = process.getBuiltinModule("node:module") as typeof import("node:module");
  return createRequire(`${process.cwd()}/package.json`)(id) as T;
}
