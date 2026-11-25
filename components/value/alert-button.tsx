"use client";

import { BellIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/client/analytics";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";

type Props = {
  title: Omit<SavedTitle, "addedAt" | "alerts" | "watched">;
  /** Alert kind stored with the title, e.g. "leaving" | "release" | "dub_available" */
  alert: string;
  label?: string;
  activeLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "md" | "sm";
  /** Icon-only round button (label stays as the accessible name) */
  iconOnly?: boolean;
  className?: string;
};

/** "Remind me" / "Notify me": saves the title to My list (localStorage) with an alert kind. */
export function AlertButton({ title, alert, label = "Remind me", activeLabel = "Reminder set", variant = "secondary", size = "md", iconOnly, className = "" }: Props) {
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

  const icon = active ? <CheckIcon className="size-4 text-available" /> : <BellIcon className="size-4" />;

  if (iconOnly)
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={`${active ? activeLabel : label}: ${title.name}`}
        title={active ? activeLabel : label}
        onClick={toggle}
        className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition duration-200 ease-out active:scale-95 ${
          active ? "bg-text/10 text-text ring-transparent" : "text-text-2 ring-hairline-strong hover:bg-text/6 hover:text-text"
        } ${className}`}
      >
        {icon}
      </button>
    );

  const cls =
    variant === "link"
      ? "inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-text-2 hover:text-text"
      : // An active reminder steps back to the quiet style whatever the resting variant was.
        buttonClass(active ? "secondary" : variant, size);

  return (
    <button type="button" aria-pressed={active} onClick={toggle} className={`${cls} ${className}`}>
      {icon}
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
      className={`${buttonClass(allSaved ? "secondary" : "primary")} disabled:opacity-100 ${className}`}
    >
      {allSaved ? <CheckIcon className="size-4 text-available" /> : <PlusIcon className="size-4" />}
      {allSaved ? "All in my list" : label}
    </button>
  );
}
