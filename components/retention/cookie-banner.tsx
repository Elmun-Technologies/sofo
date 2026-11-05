"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { buttonClass } from "../ui/button";
import { OPEN_COOKIE_SETTINGS, useConsent } from "./consent";
import { useHydrated } from "./dialog";

/**
 * First-visit KVKK cookie banner (board Modals). Non-essential cookies are rejected by default —
 * nothing but essential storage runs until "Accept analytics". Persisted in localStorage.
 */
export function CookieBanner({ privacyHref = "/tr/gizlilik" }: { privacyHref?: string }) {
  const hydrated = useHydrated();
  const { consent, decide } = useConsent();
  const [reopened, setReopened] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const id = useId();

  useEffect(() => {
    const open = () => {
      setAnalytics(consent?.analytics ?? false);
      setReopened(true);
      setSettings(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
  }, [consent?.analytics]);

  if (!hydrated || (consent && !reopened)) return null;

  const done = (value: boolean) => {
    decide(value);
    setReopened(false);
    setSettings(false);
  };

  return (
    <section
      role="region"
      aria-labelledby={`${id}-t`}
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[900px] rounded-panel border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur md:bottom-5 md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
        <p id={`${id}-t`} className="flex-1 text-sm text-text md:text-[15px]">
          <span aria-hidden="true" className="mr-1.5">
            🍪
          </span>
          We use essential cookies to remember your country, language and services. With your OK we also measure which pages
          help people (KVKK / GDPR).{" "}
          <Link href={`${privacyHref}#cookies`} className="font-bold text-text-2 underline">
            Details
          </Link>
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-2 md:flex">
          <button type="button" className={`${buttonClass("ghost")} col-span-2 md:col-span-1`} onClick={() => setSettings((s) => !s)} aria-expanded={settings} aria-controls={`${id}-s`}>
            Settings
          </button>
          <button type="button" className={buttonClass("ghost")} onClick={() => done(false)}>
            Only essential
          </button>
          <button type="button" className={buttonClass("primary")} onClick={() => done(true)}>
            Accept analytics
          </button>
        </div>
      </div>

      {settings ? (
        <div id={`${id}-s`} className="mt-4 grid gap-2 border-t border-line pt-4">
          <label className="flex items-start gap-3 rounded-card bg-surface-2 p-3">
            <input type="checkbox" checked disabled className="mt-1 size-4 accent-orange" />
            <span className="text-sm">
              <span className="font-bold">Essential</span> <span className="text-text-3">· always on</span>
              <span className="block text-text-2">Edition, interface language, My list, your services and this choice. Stored on your device.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-card bg-surface-2 p-3">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-1 size-4 accent-orange"
            />
            <span className="text-sm">
              <span className="font-bold">Analytics</span> <span className="text-text-3">· off by default</span>
              <span className="block text-text-2">Google Analytics 4 with anonymised IP: page views, searches, clicks to services. No ads, no profiling.</span>
            </span>
          </label>
          <div className="flex justify-end">
            <button type="button" className={buttonClass("secondary", "sm")} onClick={() => done(analytics)}>
              Save choice
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
