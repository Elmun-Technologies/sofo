import { describe, expect, it } from "vitest";
import { pickStale, type StaleRow } from "./stale";

const d = (day: number) => new Date(Date.UTC(2026, 10, day));
const row = (titleId: number, day: number): StaleRow => ({ titleId, tmdbId: titleId * 10, type: "movie", checkedAt: d(day) });

describe("pickStale", () => {
  it("returns the oldest-checked titles before the cutoff, one per title", () => {
    const rows = [row(1, 10), row(1, 20), row(2, 5), row(3, 12), row(4, 1)];
    // title 1's newest check (20) is after the cutoff → not stale even though an older offer exists
    expect(pickStale(rows, d(18), 5).map((r) => r.titleId)).toEqual([4, 2, 3]);
  });
  it("respects the limit", () => {
    expect(pickStale([row(1, 1), row(2, 2), row(3, 3)], d(30), 2).map((r) => r.titleId)).toEqual([1, 2]);
    expect(pickStale([row(1, 1)], d(30), 0)).toEqual([]);
  });
});
