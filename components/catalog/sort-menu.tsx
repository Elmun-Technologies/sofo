"use client";

import Link from "next/link";
import { useRef } from "react";
import type { CatalogFilters, SortKey } from "@/lib/queries/catalog-pages";
import { catalogHref, SORT_LABELS } from "./catalog-url";

/** "Sort: Popular ▾" dropdown; closes after a pick. */
export function SortMenu({ base, filters, className = "" }: { base: string; filters: CatalogFilters; className?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className={`group relative ${className}`}>
      <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-1.5 rounded-button border border-line bg-surface px-4 text-sm font-bold whitespace-nowrap [&::-webkit-details-marker]:hidden">
        Sort: {SORT_LABELS[filters.sort]} <span aria-hidden="true" className="text-[10px]">▼</span>
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-card border border-line bg-surface-2 py-1 shadow-2xl shadow-black/60">
        {(Object.keys(SORT_LABELS) as SortKey[]).map((s) => (
          <li key={s}>
            <Link
              href={catalogHref(base, { ...filters, sort: s, page: 1 })}
              scroll={false}
              onClick={() => ref.current?.removeAttribute("open")}
              aria-current={filters.sort === s ? "true" : undefined}
              className={`block px-4 py-2.5 text-sm font-bold ${filters.sort === s ? "text-orange" : "text-text"}`}
            >
              {SORT_LABELS[s]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
