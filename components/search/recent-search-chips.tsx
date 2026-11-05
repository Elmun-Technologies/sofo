"use client";

import Link from "next/link";
import { ClockIcon } from "../icons";
import { useRecentSearches } from "./recent-searches";

/** Recent searches (localStorage) as chips on the empty results page. Hidden when there are none. */
export function RecentSearchChips({ action }: { action: string }) {
  const { items, clear } = useRecentSearches();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="recent-h" className="mb-8">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 lang="en" id="recent-h" className="text-xs font-extrabold tracking-[0.08em] text-text-3 uppercase">
          Recent
        </h2>
        <button type="button" onClick={clear} className="ml-auto text-xs font-bold text-text-3 hover:text-text">
          Clear
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((q) => (
          <li key={q}>
            <Link
              href={`${action}?q=${encodeURIComponent(q)}`}
              className="inline-flex h-9 items-center gap-2 rounded-chip border border-line bg-surface px-3.5 text-sm font-bold hover:border-text-3 hover:text-text"
            >
              <ClockIcon className="size-4 text-text-3" />
              {q}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
