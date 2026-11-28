import { describe, expect, it } from "vitest";
import { pickRotationSlice, rotationSlices } from "./rotation";

describe("catalogue rotation", () => {
  it("cycles through every slice once a week", () => {
    const start = Date.UTC(2026, 10, 28);
    const seen = new Set<number>();
    for (let d = 0; d < 7; d++) seen.add(pickRotationSlice("tr", new Date(start + d * 86_400_000)).index);
    expect(seen.size).toBe(rotationSlices("tr").length);
  });

  it("is stable within a day", () => {
    const a = pickRotationSlice("tr", new Date("2026-11-28T00:05:00Z"));
    const b = pickRotationSlice("tr", new Date("2026-11-28T23:55:00Z"));
    expect(a.index).toBe(b.index);
  });

  it("honours a manual override, including negatives and overflow", () => {
    expect(pickRotationSlice("tr", new Date(), 2).slice.originalLanguage).toBe("tr");
    expect(pickRotationSlice("tr", new Date(), 9).index).toBe(2);
    expect(pickRotationSlice("tr", new Date(), -1).index).toBe(6);
  });
});
