import { describe, expect, it } from "vitest";
import { applyPlanToState, planDiff, planStats, type CurrentOfferState } from "./diff";
import type { SnapshotOffer } from "./normalize";

const offer = (over: Partial<SnapshotOffer> = {}): SnapshotOffer => ({
  countryCode: "TR",
  serviceSlug: "netflix",
  type: "subscription",
  quality: "hd",
  price: null,
  currency: null,
  url: "https://www.netflix.com/tr/title/1",
  leavingAt: null,
  audio: [
    { lang: "en", status: "confirmed_yes" },
    { lang: "tr", status: "confirmed_yes" },
  ],
  subtitle: [{ lang: "tr", status: "confirmed_yes" }],
  ...over,
});

const currentFrom = (offers: SnapshotOffer[]): CurrentOfferState[] => {
  let id = 0;
  return offers.map((o) => applyPlanToState([], planDiff([], [o]), () => ++id)[0]!);
};

describe("planDiff", () => {
  it("creates missing offers and records `added` events", () => {
    const plan = planDiff([], [offer()]);
    expect(plan.creates).toHaveLength(1);
    expect(plan.updates).toHaveLength(0);
    expect(plan.deactivates).toHaveLength(0);
    expect(plan.events).toHaveLength(1);
    expect(plan.events[0]).toMatchObject({ type: "added", serviceSlug: "netflix", offerType: "subscription" });
    expect(plan.events[0]?.after).toMatchObject({ quality: "hd", price: null });
  });

  it("is idempotent: the same snapshot twice changes nothing", () => {
    const snapshot = [offer(), offer({ serviceSlug: "prime-video", type: "rent", quality: "hd", price: 49.9, currency: "TRY" })];
    let nextId = 0;
    const state = applyPlanToState([], planDiff([], snapshot), () => ++nextId);

    const second = planDiff(state, snapshot);
    expect(second.creates).toHaveLength(0);
    expect(second.updates).toHaveLength(0);
    expect(second.deactivates).toHaveLength(0);
    expect(second.events).toHaveLength(0);
    expect(planStats(second, state.length)).toEqual({ created: 0, updated: 0, deactivated: 0, unchanged: 2, events: 0 });
  });

  it("updates the price with a before/after price_change event", () => {
    const state = currentFrom([offer({ type: "rent", price: 39.9, currency: "TRY" })]);
    const plan = planDiff(state, [offer({ type: "rent", price: 49.9, currency: "TRY" })]);

    expect(plan.updates).toHaveLength(1);
    expect(plan.events).toHaveLength(1);
    expect(plan.events[0]).toMatchObject({
      type: "price_change",
      before: { price: 39.9, currency: "TRY" },
      after: { price: 49.9, currency: "TRY" },
    });
  });

  it("deactivates offers missing from the snapshot and records `removed`", () => {
    const state = currentFrom([offer(), offer({ serviceSlug: "prime-video" })]);
    const plan = planDiff(state, [offer()]);

    expect(plan.deactivates).toHaveLength(1);
    expect(plan.deactivates[0]?.serviceSlug).toBe("prime-video");
    expect(plan.events).toHaveLength(1);
    expect(plan.events[0]).toMatchObject({ type: "removed", serviceSlug: "prime-video" });
  });

  it("records added and removed audio and subtitles", () => {
    const state = currentFrom([
      offer({
        audio: [{ lang: "en", status: "confirmed_yes" }],
        subtitle: [{ lang: "en", status: "confirmed_yes" }],
      }),
    ]);
    const plan = planDiff(state, [
      offer({
        audio: [
          { lang: "en", status: "confirmed_yes" },
          { lang: "tr", status: "confirmed_yes" },
        ],
        subtitle: [],
      }),
    ]);

    expect(plan.events.map((e) => e.type).sort()).toEqual(["audio_added", "subtitle_removed"]);
    expect(plan.updates).toHaveLength(1);
  });

  it("never reports a language as removed when it was never confirmed", () => {
    const state = currentFrom([offer({ audio: [{ lang: "tr", status: "unknown" }] })]);
    const plan = planDiff(state, [offer({ audio: [{ lang: "tr", status: "confirmed_yes" }] })]);
    expect(plan.events.map((e) => e.type)).toEqual(["audio_added"]);
  });

  it("announces a leaving date once", () => {
    const state = currentFrom([offer()]);
    const leavingAt = new Date("2026-12-01T00:00:00Z");
    const plan = planDiff(state, [offer({ leavingAt })]);

    expect(plan.events).toHaveLength(1);
    expect(plan.events[0]).toMatchObject({ type: "leaving_announced", after: { leavingAt: "2026-12-01" } });

    let nextId = 100;
    const after = applyPlanToState(state, plan, () => ++nextId);
    expect(planDiff(after, [offer({ leavingAt })]).events).toHaveLength(0);
  });

  it("treats a quality change as remove + add (quality is part of the offer key)", () => {
    const state = currentFrom([offer({ quality: "hd" })]);
    const plan = planDiff(state, [offer({ quality: "uhd" })]);

    expect(plan.creates).toHaveLength(1);
    expect(plan.deactivates).toHaveLength(1);
    expect(plan.events.map((e) => e.type).sort()).toEqual(["added", "removed"]);
  });

  it("counts unchanged offers", () => {
    const state = currentFrom([offer(), offer({ serviceSlug: "prime-video" })]);
    const plan = planDiff(state, [offer()]);
    expect(planStats(plan, state.length)).toEqual({ created: 0, updated: 0, deactivated: 1, unchanged: 1, events: 1 });
  });
});
