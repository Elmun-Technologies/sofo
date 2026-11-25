"use client";

import Link from "next/link";
import { useLocalStore } from "@/lib/client/local-store";
import { GlobeIcon } from "../icons";
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
    <div
      role="region"
      aria-label="Suggested edition"
      className="animate-fade-up flex flex-col gap-4 rounded-card border border-hairline-strong bg-surface p-4 md:flex-row md:items-center md:gap-5 md:rounded-full md:py-2.5 md:pr-2.5 md:pl-5"
    >
      <p className="flex flex-1 items-start gap-3 text-sm text-text-2 md:items-center md:text-[15px]">
        <GlobeIcon className="mt-0.5 size-[18px] shrink-0 text-text md:mt-0" />
        <span>
          <span className="font-medium text-text">Looks like you&apos;re in {e.countryName}.</span> Catalogs differ by country — go to sofo {e.countryName}?
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Link href={e.home} className={buttonClass("primary", "sm")}>
          Switch
        </Link>
        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setDismissed(true)}>
          Not now
        </button>
        <span className="ml-auto pl-1 text-[11px] text-text-3 md:hidden lg:inline lg:pr-3">no auto-redirect</span>
      </div>
    </div>
  );
}
