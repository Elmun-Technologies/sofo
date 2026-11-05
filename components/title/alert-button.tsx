"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/client/analytics";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";

/** Follows a title: saves it to My list with alert kinds; managed on /{lang}/listem#alerts. */
export function AlertButton({ title, kinds, label }: { title: Omit<SavedTitle, "addedAt" | "alerts">; kinds: string[]; label: string }) {
  const list = useWatchlist();
  const { lang } = useParams<{ lang: string }>();
  const saved = list.get(title.id);
  const following = !!saved?.alerts?.length;

  if (following)
    return (
      <Link href={`/${lang}/listem#alerts`} className={buttonClass("secondary")}>
        🔔 Following · manage
      </Link>
    );
  return (
    <button
      type="button"
      className={buttonClass("secondary")}
      onClick={() => {
        if (saved) list.update(title.id, { alerts: kinds });
        else list.add({ ...title, alerts: kinds });
        track("alert_subscribe", { title: title.name, kinds: kinds.join(",") });
      }}
    >
      {label}
    </button>
  );
}
