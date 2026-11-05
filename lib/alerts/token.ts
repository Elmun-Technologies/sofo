/**
 * Signed user reference "<userId>_<sig>" — server-only (node:crypto).
 * Used as the Telegram deep-link payload (t.me/<bot>?start=<token>, allowed chars A–Z a–z 0–9 _ -, ≤ 64)
 * and as the browser's `ref` for anonymous Telegram subscriptions.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "sofo-dev-alerts-secret";
let warned = false;

function secret(): string {
  const s = process.env.ALERTS_SECRET ?? process.env.CRON_SECRET;
  if (s) return s;
  if (!warned) {
    console.warn("[alerts] ALERTS_SECRET is not set — using a development secret");
    warned = true;
  }
  return DEV_SECRET;
}

function sig(userId: string, key: string): string {
  return createHmac("sha256", key).update(`user:${userId}`).digest("base64url").slice(0, 22);
}

export function signUserRef(userId: string, key = secret()): string {
  return `${userId}_${sig(userId, key)}`;
}

/** Returns the userId for a valid token, else null. cuid ids contain no "_", so split at the first one. */
export function verifyUserRef(token: string | null | undefined, key = secret()): string | null {
  if (!token) return null;
  const i = token.indexOf("_");
  if (i <= 0) return null;
  const userId = token.slice(0, i);
  if (!/^[a-z0-9]{8,40}$/.test(userId)) return null;
  const a = Buffer.from(token.slice(i + 1));
  const b = Buffer.from(sig(userId, key));
  return a.length === b.length && timingSafeEqual(a, b) ? userId : null;
}
