"use client";

import Link from "next/link";
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
    <div id={id} className="scroll-mt-20">
      <PosterRow title={title} sub={sub} cards={shown} edition={edition} href={href} />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[15px] font-bold">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(ev) => onChange(ev.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-chip bg-line transition peer-checked:bg-orange peer-focus-visible:outline-2 peer-focus-visible:outline-orange after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4"
      />
      {label}
    </label>
  );
}

/** Parent settings — stored locally (no account needed). Mobile: collapsible row. */
export function ParentSettings({ langLabel, myListHref }: { langLabel: string; myListHref: string }) {
  const [settings, setSettings] = useKidsSettings();
  const [prefs] = usePrefs();
  const summary = [settings.onlyDub ? `Only ${langLabel} audio` : null, settings.myServices ? "My services" : null].filter(Boolean).join(" · ") || "Off";

  return (
    <details className="group rounded-panel border border-line bg-surface md:open:pb-1" open>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-extrabold md:text-xl">Parent settings</h2>
        <span className="ml-auto truncate text-sm text-text-2">{summary}</span>
        <span aria-hidden="true" className="text-text-2 transition group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="px-5 pb-4">
        <Toggle label={`Only titles with ${langLabel} audio`} checked={settings.onlyDub} onChange={(v) => setSettings((s) => ({ ...s, onlyDub: v }))} />
        <Toggle label="Only services we have" checked={settings.myServices} onChange={(v) => setSettings((s) => ({ ...s, myServices: v }))} />
        {settings.myServices && prefs.services.length === 0 ? (
          <p className="mt-1 text-xs text-leaving">
            You haven&apos;t picked your services yet —{" "}
            <Link href={myListHref} className="underline">
              choose them in My list
            </Link>
            .
          </p>
        ) : null}
        <p className="mt-3 text-xs text-text-3">Saved on this device. Audio is shown only when the service confirms it.</p>
      </div>
    </details>
  );
}
