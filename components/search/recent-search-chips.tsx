"use client";

import { ClockIcon } from "../icons";
import { ChipLink } from "../ui/chip";
import { useRecentSearches } from "./recent-searches";

/** Recent searches (localStorage) as chips on the empty results page. Hidden when there are none. */
export function RecentSearchChips({ action }: { action: string }) {
  const { items, clear } = useRecentSearches();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="recent-h" className="mb-8 md:mb-10">
      <div className="mb-3.5 flex items-center gap-4">
        <h2 lang="en" id="recent-h" className="overline text-text-3">
          Recent
        </h2>
        <button type="button" onClick={clear} className="text-xs font-medium text-text-3 underline decoration-hairline-strong underline-offset-[3px] transition-colors hover:text-text">
          Clear
        </button>
      </div>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {items.map((q) => (
          <li key={q} className="shrink-0">
            <ChipLink href={`${action}?q=${encodeURIComponent(q)}`}>
              <ClockIcon className="size-3.5 text-text-3" />
              {q}
            </ChipLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
