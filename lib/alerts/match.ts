import type { AlertKindName } from "./kinds";

/** An AvailabilityEvent as the alert pipeline sees it (DB row + joined names). */
export type AlertEvent = {
  /** BigInt id as string */
  id: string;
  titleId: number;
  titleName: string;
  /** Edition path of the title page, e.g. /tr/dizi/arcane */
  titlePath: string | null;
  countryCode: string;
  serviceSlug: string;
  serviceName: string;
  /** Prisma EventType */
  type: string;
  offerType: string | null;
  before: unknown;
  after: unknown;
  occurredAt: Date;
};

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function jsonNumber(v: unknown, key: string): number | null {
  const x = obj(v)[key];
  const n = typeof x === "string" ? Number(x) : x;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export function jsonString(v: unknown, key: string): string | null {
  const x = obj(v)[key];
  if (typeof x === "string" && x) return x;
  if (x instanceof Date) return x.toISOString();
  return null;
}

/**
 * Which alert kind an event fires, for an edition language. Deterministic, no guessing:
 * - dub_available ⇐ audio_added for the edition language
 * - leaving       ⇐ leaving_announced
 * - price_drop    ⇐ price_change with a lower after.price (or moved to free / ads)
 * - new_episode   ⇐ added on a season / episode offer
 * - release       ⇐ added on the title itself (first time streaming in the country)
 */
export function eventAlertKind(ev: Pick<AlertEvent, "type" | "before" | "after" | "offerType">, editionLang: string): AlertKindName | null {
  switch (ev.type) {
    case "audio_added": {
      const lang = jsonString(ev.after, "lang");
      const kind = jsonString(ev.after, "kind");
      return lang === editionLang && (kind === null || kind === "audio") ? "dub_available" : null;
    }
    case "leaving_announced":
      return "leaving";
    case "price_change": {
      const before = jsonNumber(ev.before, "price");
      const after = jsonNumber(ev.after, "price");
      if (before !== null && after !== null && after < before) return "price_drop";
      if (ev.offerType === "free" || ev.offerType === "ads") return "price_drop";
      return null;
    }
    case "added": {
      const isPart = jsonNumber(ev.after, "seasonId") !== null || jsonNumber(ev.after, "episodeId") !== null;
      return isPart ? "new_episode" : "release";
    }
    default:
      return null;
  }
}
