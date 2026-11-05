"use client";

import Link from "next/link";
import { useLocalStore } from "@/lib/client/local-store";
import { buttonClass } from "../ui/button";
import { useHydrated } from "./dialog";

type LiveEdition = { code: string; country: string; countryName: string; home: string; langs: string[] };

/** Region from the browser locale (e.g. "tr-TR" → "TR"); a bare language maps through the edition languages. No IP lookup. */
function guessEdition(editions: LiveEdition[]): LiveEdition | undefined {
  const locales = typeof navigator === "undefined" ? [] : [...(navigator.languages ?? []), navigator.language];
  for (const l of locales) {
    const region = /[-_]([A-Za-z]{2})\b/.exec(l)?.[1]?.toUpperCase();
    const hit = region ? editions.find((e) => e.country === region) : editions.find((e) => e.langs.includes(l.slice(0, 2).toLowerCase()));
    if (hit) return hit;
  }
  return undefined;
}

/**
 * "Looks like you're in Türkiye" suggestion on the edition picker. Never redirects on its own
 * (CLAUDE.md: no IP auto-redirect) — the user taps Switch or dismisses it.
 */
export function EditionSuggest({ editions }: { editions: LiveEdition[] }) {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useLocalStore<boolean>("sofo:edition-suggest-dismissed:v1", false);
  if (!hydrated || dismissed) return null;
  const e = guessEdition(editions);
  if (!e) return null;
  return (
    <div role="region" aria-label="Suggested edition" className="flex flex-col gap-3 rounded-card border border-dub/40 bg-dub/10 px-4 py-3.5 md:flex-row md:items-center md:px-5">
      <p className="flex-1 text-sm font-bold md:text-[15px]">
        Looks like you&apos;re in {e.countryName}. Catalogs differ by country — go to sofo {e.countryName}?
      </p>
      <div className="flex items-center gap-2">
        <Link href={e.home} className={buttonClass("primary", "sm")}>
          Switch
        </Link>
        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setDismissed(true)}>
          Not now
        </button>
        <span className="ml-1 text-[11px] text-text-3">no auto-redirect</span>
      </div>
    </div>
  );
}
