"use client";

import { track } from "@/lib/client/analytics";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";
import { BookmarkIcon, CheckIcon } from "./icons";
import { buttonClass } from "./ui/button";

export function WatchlistButton({ title, variant = "secondary", compact }: { title: Omit<SavedTitle, "addedAt">; variant?: "secondary" | "ghost"; compact?: boolean }) {
  const list = useWatchlist();
  const saved = list.has(title.id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      className={buttonClass(variant, compact ? "sm" : "md")}
      onClick={() => {
        if (saved) list.remove(title.id);
        else {
          list.add(title);
          track("list_add", { title: title.name });
        }
      }}
    >
      {saved ? <CheckIcon className="size-4 text-available" /> : <BookmarkIcon className="size-4" />}
      {saved ? "In my list" : "My list"}
    </button>
  );
}
