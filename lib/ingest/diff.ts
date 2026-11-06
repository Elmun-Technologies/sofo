/**
 * Availability snapshot vs current offers → a write plan (pure, no DB).
 * Semantics: docs/data-model.md §3.
 *
 *  new only      → create + `added`
 *  current only  → deactivate + `removed`
 *  price differs → update + `price_change`
 *  language set  → update + `audio_added`/`audio_removed`/`subtitle_added`/`subtitle_removed`
 *  leavingAt new → update + `leaving_announced`
 *  quality       → part of the offer key, so a quality change is `removed` + `added`
 *
 * A second run over the same snapshot yields an empty plan (idempotent) — only checkedAt is
 * refreshed by the writer, because that is what the page shows as "checked".
 */
import type { EventType, LangStatus, OfferType } from "@prisma/client";
import { offerKey, type SnapshotOffer } from "./normalize";

export type CurrentOfferState = {
  id: number;
  serviceSlug: string;
  type: OfferType;
  quality: string | null;
  price: number | null;
  currency: string | null;
  url: string;
  leavingAt: Date | null;
  audio: Record<string, LangStatus>;
  subtitle: Record<string, LangStatus>;
};

export type PlannedEvent = {
  serviceSlug: string;
  type: EventType;
  offerType: OfferType;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type DiffPlan = {
  creates: SnapshotOffer[];
  updates: { current: CurrentOfferState; next: SnapshotOffer }[];
  deactivates: CurrentOfferState[];
  events: PlannedEvent[];
};

export type DiffStats = { created: number; updated: number; deactivated: number; unchanged: number; events: number };

const cents = (n: number | null): number | null => (n === null ? null : Math.round(n * 100));
const dayKey = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

/** Snapshot offer (or a DB row) as a language map. */
export function toCurrentState(id: number, offer: SnapshotOffer): CurrentOfferState {
  const audio: Record<string, LangStatus> = {};
  const subtitle: Record<string, LangStatus> = {};
  for (const l of offer.audio) audio[l.lang] = l.status;
  for (const l of offer.subtitle) subtitle[l.lang] = l.status;
  return {
    id,
    serviceSlug: offer.serviceSlug,
    type: offer.type,
    quality: offer.quality,
    price: offer.price,
    currency: offer.currency,
    url: offer.url,
    leavingAt: offer.leavingAt,
    audio,
    subtitle,
  };
}

const langMap = (list: { lang: string; status: LangStatus }[]): Record<string, LangStatus> =>
  Object.fromEntries(list.map((l) => [l.lang, l.status]));

const sameMap = (a: Record<string, LangStatus>, b: Record<string, LangStatus>): boolean => {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
};

const confirmed = (map: Record<string, LangStatus>): string[] =>
  Object.entries(map)
    .filter(([, status]) => status === "confirmed_yes")
    .map(([lang]) => lang)
    .sort();

function summary(offer: { quality: string | null; price: number | null; currency: string | null; url: string }) {
  return { quality: offer.quality, price: offer.price, currency: offer.currency, url: offer.url };
}

export function planDiff(current: CurrentOfferState[], snapshot: SnapshotOffer[]): DiffPlan {
  const byKey = new Map(current.map((o) => [offerKey(o), o]));
  const seen = new Set<string>();
  const plan: DiffPlan = { creates: [], updates: [], deactivates: [], events: [] };

  for (const next of snapshot) {
    const key = offerKey(next);
    seen.add(key);
    const cur = byKey.get(key);
    if (!cur) {
      plan.creates.push(next);
      plan.events.push({ serviceSlug: next.serviceSlug, type: "added", offerType: next.type, before: null, after: summary(next) });
      continue;
    }

    const nextAudio = langMap(next.audio);
    const nextSubtitle = langMap(next.subtitle);
    const priceChanged = cents(cur.price) !== cents(next.price) || (cur.currency ?? null) !== (next.currency ?? null);
    const leavingChanged = dayKey(cur.leavingAt) !== dayKey(next.leavingAt);
    const languagesChanged = !sameMap(cur.audio, nextAudio) || !sameMap(cur.subtitle, nextSubtitle);
    const urlChanged = cur.url !== next.url;

    if (priceChanged) {
      plan.events.push({
        serviceSlug: next.serviceSlug,
        type: "price_change",
        offerType: next.type,
        before: { price: cur.price, currency: cur.currency },
        after: { price: next.price, currency: next.currency },
      });
    }
    if (next.leavingAt && leavingChanged) {
      plan.events.push({
        serviceSlug: next.serviceSlug,
        type: "leaving_announced",
        offerType: next.type,
        before: { leavingAt: dayKey(cur.leavingAt) },
        after: { leavingAt: dayKey(next.leavingAt) },
      });
    }

    const curAudio = confirmed(cur.audio);
    const curSubtitle = confirmed(cur.subtitle);
    for (const lang of confirmed(nextAudio)) {
      if (!curAudio.includes(lang)) {
        plan.events.push({ serviceSlug: next.serviceSlug, type: "audio_added", offerType: next.type, before: null, after: { lang, kind: "audio" } });
      }
    }
    for (const lang of curAudio) {
      if (!confirmed(nextAudio).includes(lang)) {
        plan.events.push({ serviceSlug: next.serviceSlug, type: "audio_removed", offerType: next.type, before: { lang, kind: "audio" }, after: null });
      }
    }
    for (const lang of confirmed(nextSubtitle)) {
      if (!curSubtitle.includes(lang)) {
        plan.events.push({ serviceSlug: next.serviceSlug, type: "subtitle_added", offerType: next.type, before: null, after: { lang, kind: "subtitle" } });
      }
    }
    for (const lang of curSubtitle) {
      if (!confirmed(nextSubtitle).includes(lang)) {
        plan.events.push({ serviceSlug: next.serviceSlug, type: "subtitle_removed", offerType: next.type, before: { lang, kind: "subtitle" }, after: null });
      }
    }

    if (priceChanged || leavingChanged || languagesChanged || urlChanged) plan.updates.push({ current: cur, next });
  }

  for (const cur of current) {
    if (seen.has(offerKey(cur))) continue;
    plan.deactivates.push(cur);
    plan.events.push({ serviceSlug: cur.serviceSlug, type: "removed", offerType: cur.type, before: summary(cur), after: null });
  }

  return plan;
}

export function planStats(plan: DiffPlan, currentCount: number): DiffStats {
  return {
    created: plan.creates.length,
    updated: plan.updates.length,
    deactivated: plan.deactivates.length,
    unchanged: Math.max(0, currentCount - plan.updates.length - plan.deactivates.length),
    events: plan.events.length,
  };
}

/** Applies a plan to an in-memory state — used to prove idempotency without a database. */
export function applyPlanToState(current: CurrentOfferState[], plan: DiffPlan, nextId: () => number): CurrentOfferState[] {
  const byId = new Map(current.map((o) => [o.id, o]));
  for (const row of plan.deactivates) byId.delete(row.id);
  for (const { current: cur, next } of plan.updates) byId.set(cur.id, toCurrentState(cur.id, next));
  for (const create of plan.creates) {
    const id = nextId();
    byId.set(id, toCurrentState(id, create));
  }
  return [...byId.values()];
}
