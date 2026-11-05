"use client";

import { useLocalStore } from "@/lib/client/local-store";

/**
 * KVKK / GDPR cookie consent. Essential storage (country, services, My list) needs no consent;
 * analytics is OFF until the user explicitly accepts. `null` = not decided yet → banner shows.
 */
export type Consent = { analytics: boolean; decidedAt: string; version: 1 } | null;

const KEY = "sofo:consent:v1";
export const OPEN_COOKIE_SETTINGS = "sofo:open-cookie-settings";

export function useConsent() {
  const [consent, setConsent] = useLocalStore<Consent>(KEY, null);
  return {
    consent,
    decide: (analytics: boolean) => setConsent({ analytics, decidedAt: new Date().toISOString(), version: 1 }),
  };
}

/** Re-open the cookie settings (e.g. from the privacy page or footer). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));
}
