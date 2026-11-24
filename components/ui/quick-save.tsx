"use client";

import { track } from "@/lib/client/analytics";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";
import { BookmarkIcon } from "../icons";

/**
 * Bookmark toggle that sits on a poster. Hidden until hover/focus on pointer devices
 * (always visible once saved); not rendered for touch — the title page has the full button.
 */
export function QuickSave({ title }: { title: Omit<SavedTitle, "addedAt"> }) {
  const list = useWatchlist();
  const saved = list.has(title.id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title.name} from my list` : `Add ${title.name} to my list`}
      title={saved ? "In my list" : "Add to my list"}
      onClick={() => {
        if (saved) list.remove(title.id);
        else {
          list.add(title);
          track("list_add", { title: title.name });
        }
      }}
      className={`absolute top-2 right-2 z-10 hidden size-8 items-center justify-center rounded-full ring-1 ring-inset backdrop-blur-md transition duration-150 ease-out active:scale-90 [@media(hover:hover)]:inline-flex ${
        saved
          ? "bg-orange text-ink ring-transparent"
          : "bg-black/55 text-white opacity-0 ring-white/20 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
      }`}
    >
      <BookmarkIcon className={`size-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
