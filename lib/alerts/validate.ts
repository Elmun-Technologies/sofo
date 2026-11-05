/** Input validation for alert subscriptions (API + client pre-check). Pure, client-safe. */
import { isAlertKind, type AlertKindName } from "./kinds";

export type Contact = { channel: "email"; email: string } | { channel: "telegram"; handle: string };

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
/** Telegram usernames: 5–32 chars, a–z, 0–9, underscore, starting with a letter. */
const TG_RE = /^@?([A-Za-z][A-Za-z0-9_]{4,31})$/;

/** "you@mail.com" → email, "@handle" / "t.me/handle" → telegram, anything else → null. */
export function parseContact(raw: unknown): Contact | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().replace(/^(?:https?:\/\/)?t\.me\//i, "@");
  if (!v || v.length > 254) return null;
  if (v.includes("@") && !v.startsWith("@")) return EMAIL_RE.test(v) ? { channel: "email", email: v.toLowerCase() } : null;
  const m = TG_RE.exec(v);
  return m ? { channel: "telegram", handle: m[1]!.toLowerCase() } : null;
}

export type AlertRequest = { titleId: number; kinds: AlertKindName[] };

export type SubscribeInput = {
  contact: Contact;
  edition: string;
  alerts: AlertRequest[];
  /** Signed reference of an earlier anonymous (Telegram) subscription from this browser */
  ref: string | null;
};

export const MAX_ALERTS_PER_REQUEST = 100;

export function parseSubscribeInput(body: unknown): { ok: true; value: SubscribeInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;
  // Honeypot: real users never fill this hidden field.
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, error: "Invalid request." };

  const contact = parseContact(b.contact);
  if (!contact) return { ok: false, error: "Enter an email address or a Telegram @username." };

  const edition = typeof b.edition === "string" && /^[a-z]{2}$/.test(b.edition) ? b.edition : null;
  if (!edition) return { ok: false, error: "Invalid edition." };

  const rawAlerts = b.alerts ?? [];
  if (!Array.isArray(rawAlerts) || rawAlerts.length > MAX_ALERTS_PER_REQUEST) return { ok: false, error: "Too many titles." };
  const byTitle = new Map<number, Set<AlertKindName>>();
  for (const a of rawAlerts) {
    if (!a || typeof a !== "object") return { ok: false, error: "Invalid alert." };
    const { titleId, kinds } = a as Record<string, unknown>;
    if (typeof titleId !== "number" || !Number.isInteger(titleId) || titleId <= 0) return { ok: false, error: "Invalid title." };
    if (!Array.isArray(kinds) || kinds.length === 0 || !kinds.every(isAlertKind)) return { ok: false, error: "Pick at least one alert." };
    const set = byTitle.get(titleId) ?? new Set<AlertKindName>();
    kinds.forEach((k) => set.add(k));
    byTitle.set(titleId, set);
  }

  const ref = typeof b.ref === "string" && b.ref.length <= 80 ? b.ref : null;
  return {
    ok: true,
    value: { contact, edition, alerts: [...byTitle].map(([titleId, kinds]) => ({ titleId, kinds: [...kinds] })), ref },
  };
}

/** Merge alert kinds (subscriptions never silently drop what a user already follows). */
export function mergeKinds(existing: readonly AlertKindName[], incoming: readonly AlertKindName[]): AlertKindName[] {
  return [...new Set([...existing, ...incoming])];
}

/**
 * Same-origin check for mutations. The Origin header must be present and match either
 * NEXT_PUBLIC_SITE_URL or the request Host.
 */
export function isSameOrigin(origin: string | null, host: string | null, siteUrl: string | undefined): boolean {
  if (!origin) return false;
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  if (siteUrl) {
    try {
      if (new URL(siteUrl).host === o.host) return true;
    } catch {
      /* ignore bad env */
    }
  }
  return !!host && o.host === host;
}

export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}
