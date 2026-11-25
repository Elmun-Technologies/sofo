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
      className="animate-sheet-up fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 rounded-panel border border-hairline-strong bg-surface-2/95 p-4 shadow-pop backdrop-blur-xl md:inset-x-auto md:right-auto md:bottom-5 md:left-5 md:w-[420px] md:p-5"
    >
      <h2 id={`${id}-t`} className="text-[15px] font-extrabold">
        Your privacy
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
        Essential storage remembers your country, language and services. With your OK we also measure which pages help
        people (KVKK / GDPR).{" "}
        <Link href={`${privacyHref}#cookies`} className="link">
          Details
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className={`${buttonClass("primary", "sm")} flex-1`} onClick={() => done(true)}>
          Accept analytics
        </button>
        <button type="button" className={`${buttonClass("secondary", "sm")} flex-1`} onClick={() => done(false)}>
          Only essential
        </button>
        <button type="button" className={buttonClass("quiet", "sm")} onClick={() => setSettings((s) => !s)} aria-expanded={settings} aria-controls={`${id}-s`}>
          Settings
        </button>
      </div>

      {settings ? (
        <div id={`${id}-s`} className="mt-4 grid gap-2 border-t border-hairline pt-4">
          <label className="flex items-start gap-3 rounded-card bg-ink/50 p-3">
            <input type="checkbox" checked disabled className="mt-1 size-4 accent-orange" />
            <span className="text-[13px]">
              <span className="font-bold">Essential</span> <span className="text-text-3">· always on</span>
              <span className="block text-text-2">Edition, interface language, My list, your services and this choice. Stored on your device.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-card bg-ink/50 p-3">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-1 size-4 accent-orange"
            />
            <span className="text-[13px]">
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
