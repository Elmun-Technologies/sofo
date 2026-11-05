import { describe, expect, it } from "vitest";
import { computeShortAnswer, notOn, type AnswerOffer } from "./short-answer";

const offer = (o: Partial<AnswerOffer>): AnswerOffer => ({
  serviceSlug: "netflix",
  serviceName: "Netflix",
  type: "subscription",
  price: null,
  currency: null,
  url: "https://example.com",
  audio: "unknown",
  subtitle: "unknown",
  ...o,
});

describe("computeShortAnswer", () => {
  it("prefers a streaming offer with confirmed audio", () => {
    const a = computeShortAnswer([
      offer({ serviceSlug: "prime", serviceName: "Prime", type: "rent", price: 49, audio: "confirmed_yes" }),
      offer({ subtitle: "confirmed_yes" }),
      offer({ serviceSlug: "disney", serviceName: "Disney+", audio: "confirmed_yes" }),
    ]);
    expect(a).toMatchObject({ kind: "yes_audio", offer: { serviceSlug: "disney" } });
  });

  it("free beats subscription when both have the language", () => {
    const a = computeShortAnswer([
      offer({ audio: "confirmed_yes" }),
      offer({ serviceSlug: "tabii", serviceName: "tabii", type: "ads", audio: "confirmed_yes" }),
    ]);
    expect(a).toMatchObject({ kind: "yes_audio", offer: { serviceSlug: "tabii" } });
  });

  it("falls back to subtitles only", () => {
    expect(computeShortAnswer([offer({ audio: "confirmed_no", subtitle: "confirmed_yes" })]).kind).toBe("yes_subtitle");
  });

  it("never claims a language that is unknown", () => {
    expect(computeShortAnswer([offer({})]).kind).toBe("yes_unconfirmed");
  });

  it("rent/buy only picks the cheapest", () => {
    const a = computeShortAnswer([
      offer({ type: "buy", price: 129 }),
      offer({ serviceSlug: "apple", serviceName: "Apple TV", type: "rent", price: 49 }),
    ]);
    expect(a).toMatchObject({ kind: "rent_only", offer: { price: 49 } });
  });

  it("returns none without offers", () => {
    expect(computeShortAnswer([])).toEqual({ kind: "none" });
  });

  it("answer service is always one of the offers (no contradiction)", () => {
    const offers = [offer({ audio: "confirmed_yes" }), offer({ serviceSlug: "x", serviceName: "X", type: "rent", price: 1 })];
    const a = computeShortAnswer(offers);
    expect(a.kind !== "none" && offers.includes(a.offer)).toBe(true);
  });
});

describe("notOn", () => {
  it("lists core services without offers", () => {
    expect(notOn([offer({})], [{ slug: "netflix", name: "Netflix" }, { slug: "tod", name: "TOD" }])).toEqual([{ slug: "tod", name: "TOD" }]);
  });
});
