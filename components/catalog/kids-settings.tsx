"use client";

import Link from "next/link";
import { ChevronDownIcon, InfoIcon, ShieldCheckIcon } from "@/components/icons";
import { PosterRow } from "@/components/ui/poster-row";
import type { TitleCard } from "@/lib/catalog";
import type { Edition } from "@/lib/editions";
import { useLocalStore } from "@/lib/client/local-store";
import { usePrefs } from "@/lib/client/prefs";

type KidsSettings = { onlyDub: boolean; myServices: boolean };
const KEY = "sofo:kids:v1";
const DEFAULTS: KidsSettings = { onlyDub: false, myServices: false };

function useKidsSettings() {
  return useLocalStore<KidsSettings>(KEY, DEFAULTS);
}

/** Poster row filtered by the parent settings saved on this device. */
export function KidsRow({ id, title, sub, cards, edition, href }: { id?: string; title: string; sub?: string; cards: TitleCard[]; edition: Edition; href?: string }) {
  const [settings] = useKidsSettings();
  const [prefs] = usePrefs();
  const mine = settings.myServices && prefs.services.length ? new Set(prefs.services) : null;
  const shown = cards.filter((c) => (!settings.onlyDub || c.dub) && (!mine || c.services.some((s) => mine.has(s.slug))));
  return (
    <div id={id} className="scroll-mt-24">
      <PosterRow title={title} sub={sub} cards={shown} edition={edition} href={href} />
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-4 py-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[13px] text-text-3">{hint}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(ev) => onChange(ev.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-white/10 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset peer-checked:bg-white peer-checked:ring-transparent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white/70 after:transition after:duration-200 after:ease-out peer-checked:after:translate-x-5 peer-checked:after:bg-ink"
      />
    </label>
  );
}

/** Parent settings — stored locally (no account needed). Collapsible so it never crowds the shelves. */
export function ParentSettings({ langLabel, myListHref }: { langLabel: string; myListHref: string }) {
  const [settings, setSettings] = useKidsSettings();
  const [prefs] = usePrefs();
  const summary = [settings.onlyDub ? `Only ${langLabel} audio` : null, settings.myServices ? "My services" : null].filter(Boolean).join(" · ") || "Off";
  const on = settings.onlyDub || settings.myServices;

  return (
    <details className="panel group" open>
      <summary className="flex list-none items-center gap-3.5 px-5 py-4 md:px-6 md:py-5">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-text-2">
          <ShieldCheckIcon className="size-5" />
        </span>
        <h2 className="text-h3 min-w-0 flex-1 truncate">Parent settings</h2>
        <span className={`tag shrink-0 ${on ? "!border-white/40 !text-text" : ""}`}>
          {on ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-available" /> : null}
          <span aria-hidden="true" className="sm:hidden">
            {on ? "On" : "Off"}
          </span>
          <span className="max-sm:sr-only">{summary}</span>
        </span>
        <ChevronDownIcon className="size-5 shrink-0 text-text-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-hairline px-5 pb-4 md:px-6 md:pb-5">
        <div className="divide-y divide-hairline md:grid md:grid-cols-2 md:gap-x-12 md:divide-y-0">
          <Toggle
            label={`Only titles with ${langLabel} audio`}
            hint="Hides anything without a confirmed dub"
            checked={settings.onlyDub}
            onChange={(v) => setSettings((s) => ({ ...s, onlyDub: v }))}
          />
          <Toggle
            label="Only services we have"
            hint="Uses the services picked in My list"
            checked={settings.myServices}
            onChange={(v) => setSettings((s) => ({ ...s, myServices: v }))}
          />
        </div>
        {settings.myServices && prefs.services.length === 0 ? (
          <p className="mb-3 flex items-start gap-2 text-[13px] text-leaving">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              You haven&apos;t picked your services yet —{" "}
              <Link href={myListHref} className="underline underline-offset-4 hover:text-leaving">
                choose them in My list
              </Link>
              .
            </span>
          </p>
        ) : null}
        <p className="border-t border-hairline pt-4 text-xs text-text-3">Saved on this device. Audio is shown only when the service confirms it.</p>
      </div>
    </details>
  );
}
