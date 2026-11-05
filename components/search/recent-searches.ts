"use client";

import { useCallback } from "react";
import { useLocalStore } from "@/lib/client/local-store";

/** Recent searches — only in this browser (localStorage), never sent to the server. */
const KEY = "sofo:recent-searches:v1";
const EMPTY: string[] = [];
const MAX = 5;

export function useRecentSearches() {
  const [items, setItems] = useLocalStore<string[]>(KEY, EMPTY);
  const add = useCallback(
    (q: string) => {
      const v = q.replace(/\s+/g, " ").trim().slice(0, 100);
      if (!v) return;
      setItems((prev) => [v, ...prev.filter((p) => p.toLocaleLowerCase("tr") !== v.toLocaleLowerCase("tr"))].slice(0, MAX));
    },
    [setItems],
  );
  const clear = useCallback(() => setItems(EMPTY), [setItems]);
  return { items, add, clear };
}
