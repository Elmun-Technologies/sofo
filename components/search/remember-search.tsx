"use client";

import { useEffect } from "react";
import { useRecentSearches } from "./recent-searches";

/** Adds the current results-page query to this browser's recent searches. Renders nothing. */
export function RememberSearch({ q }: { q: string }) {
  const { add } = useRecentSearches();
  useEffect(() => {
    add(q);
  }, [q, add]);
  return null;
}
