"use client";

import { track } from "@/lib/client/analytics";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";
import { buttonClass } from "@/components/ui/button";

type Props = {
  title: Omit<SavedTitle, "addedAt" | "alerts" | "watched">;
  /** Alert kind stored with the title, e.g. "leaving" | "release" | "dub_available" */
  alert: string;
  label?: string;
  activeLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "md" | "sm";
  className?: string;
};

/** "Remind me" / "Notify me": saves the title to My list (localStorage) with an alert kind. */
export function AlertButton({ title, alert, label = "Remind me", activeLabel = "✓ Reminder set", variant = "secondary", size = "md", className = "" }: Props) {
  const list = useWatchlist();
  const saved = list.get(title.id);
  const active = !!saved?.alerts?.includes(alert);

  function toggle() {
    if (active) {
      list.update(title.id, { alerts: (saved?.alerts ?? []).filter((a) => a !== alert) });
      return;
    }
    if (saved) list.update(title.id, { alerts: [...(saved.alerts ?? []), alert] });
    else list.add({ ...title, alerts: [alert] });
    track("alert_add", { title: title.name, kind: alert });
  }

  const cls =
    variant === "link"
      ? `text-sm font-extrabold whitespace-nowrap ${active ? "text-available" : "text-leaving"} hover:text-orange-tint`
      : buttonClass(variant, size);

  return (
    <button type="button" aria-pressed={active} onClick={toggle} className={`${cls} ${className}`}>
      {active ? activeLabel : label}
    </button>
  );
}

/** Adds several titles to My list at once (franchise "add the whole franchise"). */
export function AddAllButton({ titles, label, className = "" }: { titles: Omit<SavedTitle, "addedAt">[]; label: string; className?: string }) {
  const list = useWatchlist();
  const allSaved = titles.length > 0 && titles.every((t) => list.has(t.id));
  return (
    <button
      type="button"
      aria-pressed={allSaved}
      disabled={allSaved}
      onClick={() => {
        for (const t of titles) list.add(t);
        track("list_add", { title: `${titles.length} titles`, source: "franchise" });
      }}
      className={`${buttonClass("primary")} disabled:opacity-100 ${className}`}
    >
      {allSaved ? "✓ All in my list" : label}
    </button>
  );
}
