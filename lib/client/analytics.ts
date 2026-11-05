"use client";

type GtagFn = (cmd: "event", name: string, params?: Record<string, unknown>) => void;

/** GA4 event. No-op until the GA script is loaded (only after analytics consent). */
export function track(name: string, params: Record<string, unknown> = {}) {
  const gtag = (globalThis as { gtag?: GtagFn }).gtag;
  gtag?.("event", name, params);
}
