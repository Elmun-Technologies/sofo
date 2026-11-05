import { describe, expect, it } from "vitest";
import { qualityGate } from "./quality-gate";

const now = new Date("2026-11-05T12:00:00Z");
const full = { name: "Vahşi Robot", overview: "…", posterPath: "/p.jpg", year: 2024, activeOfferCheckedAt: [new Date("2026-11-04T09:00:00Z")] };

describe("qualityGate", () => {
  it("indexes complete, fresh titles", () => {
    expect(qualityGate(full, now)).toEqual({ index: true, reasons: [] });
  });
  it("noindex without poster or overview", () => {
    expect(qualityGate({ ...full, posterPath: null, overview: null }, now).reasons).toEqual(["missing localized overview", "missing poster"]);
  });
  it("noindex without offers", () => {
    expect(qualityGate({ ...full, activeOfferCheckedAt: [] }, now).index).toBe(false);
  });
  it("noindex when offers are stale (> 7 days)", () => {
    expect(qualityGate({ ...full, activeOfferCheckedAt: [new Date("2026-10-20T00:00:00Z")] }, now).index).toBe(false);
  });
});
