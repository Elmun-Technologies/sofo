/**
 * Admin auth: HTTP Basic with ADMIN_USER / ADMIN_PASSWORD.
 * Used by proxy.ts (gate for /admin/**) and re-checked inside every server action.
 * Edge/Node-safe (Web Crypto only), no shared state.
 */
export type AdminAuthMode = "basic" | "dev" | "disabled";

/** "basic" when credentials are configured, "dev" when unset outside production, else "disabled" (→ 404). */
export function adminAuthMode(env: Record<string, string | undefined> = process.env): AdminAuthMode {
  if (env.ADMIN_USER && env.ADMIN_PASSWORD) return "basic";
  return env.NODE_ENV === "production" ? "disabled" : "dev";
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** Constant-time string comparison (compares fixed-length SHA-256 digests). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < da.length; i++) diff |= da[i]! ^ db[i]!;
  return diff === 0;
}

/** Validates an `Authorization: Basic …` header against the configured credentials. */
export async function checkBasicAuth(header: string | null | undefined, user: string, password: string): Promise<boolean> {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  // Evaluate both comparisons regardless of the first result (no early exit).
  const [okUser, okPass] = await Promise.all([safeEqual(decoded.slice(0, sep), user), safeEqual(decoded.slice(sep + 1), password)]);
  return okUser && okPass;
}

/** Full decision for a request: allowed in "dev", checked in "basic", never in "disabled". */
export async function isAdminRequest(authorization: string | null | undefined, env: Record<string, string | undefined> = process.env): Promise<boolean> {
  const mode = adminAuthMode(env);
  if (mode === "dev") return true;
  if (mode === "disabled") return false;
  return checkBasicAuth(authorization, env.ADMIN_USER!, env.ADMIN_PASSWORD!);
}
