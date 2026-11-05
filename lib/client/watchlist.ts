"use client";

import { useLocalStore } from "./local-store";

/** My list without login (PRD 7.4) — stored in localStorage. */
export type SavedTitle = {
  id: number;
  type: "movie" | "tv";
  slug: string;
  name: string;
  posterPath: string | null;
  year: number | null;
  addedAt: string;
  watched?: boolean;
  /** Alert kinds the user follows for this title */
  alerts?: string[];
};

const KEY = "sofo:watchlist:v1";
const EMPTY: SavedTitle[] = [];

export function useWatchlist() {
  const [items, setItems] = useLocalStore<SavedTitle[]>(KEY, EMPTY);
  return {
    items,
    has: (id: number) => items.some((i) => i.id === id),
    get: (id: number) => items.find((i) => i.id === id),
    add: (t: Omit<SavedTitle, "addedAt">) => setItems((prev) => (prev.some((i) => i.id === t.id) ? prev : [{ ...t, addedAt: new Date().toISOString() }, ...prev])),
    remove: (id: number) => setItems((prev) => prev.filter((i) => i.id !== id)),
    update: (id: number, patch: Partial<SavedTitle>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
  };
}
