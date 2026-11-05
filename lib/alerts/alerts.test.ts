import { describe, expect, it } from "vitest";
import { digestEmail, eventHeadline, telegramMessage, withUtm } from "./format";
import { eventAlertKind, type AlertEvent } from "./match";
import { itemStatus, type FreshOffer } from "./my-list";
import { planDigest, planTelegram, type PlanAlert, type PlanUser } from "./plan";
import { isDigestWindow, istanbulParts, sameLocalDay } from "./time";
import { signUserRef, verifyUserRef } from "./token";
import { isSameOrigin, mergeKinds, parseContact, parseSubscribeInput } from "./validate";

const lang = (cc: string) => (cc === "TR" ? "tr" : undefined);
// Thu 5 Nov 2026 12:00 UTC = 15:00 Istanbul
const now = new Date("2026-11-05T12:00:00Z");
const h = (hours: number) => new Date(now.getTime() + hours * 3_600_000);

let seq = 0;
const ev = (o: Partial<AlertEvent>): AlertEvent => ({
  id: String(++seq),
  titleId: 1,
  titleName: "Arcane",
  titlePath: "/tr/dizi/arcane",
  countryCode: "TR",
  serviceSlug: "netflix",
  serviceName: "Netflix",
  type: "audio_added",
  offerType: "subscription",
  before: null,
  after: { lang: "tr", kind: "audio" },
  occurredAt: h(-2),
  ...o,
});

const user = (o: Partial<PlanUser> = {}): PlanUser => ({ id: "u1", email: null, telegramId: "100", countryCode: "TR", ...o });
const alert = (o: Partial<PlanAlert> = {}): PlanAlert => ({
  id: 1,
  userId: "u1",
  titleId: 1,
  kinds: ["dub_available", "leaving", "price_drop", "new_episode"],
  channel: "telegram",
  lastSentAt: null,
  createdAt: h(-48),
  ...o,
});

describe("eventAlertKind", () => {
  it("maps audio_added only for the edition language", () => {
    expect(eventAlertKind(ev({}), "tr")).toBe("dub_available");
    expect(eventAlertKind(ev({ after: { lang: "en", kind: "audio" } }), "tr")).toBeNull();
    expect(eventAlertKind(ev({ after: { lang: "tr", kind: "subtitle" } }), "tr")).toBeNull();
  });
  it("price_drop only when the price went down (or became free)", () => {
    expect(eventAlertKind(ev({ type: "price_change", before: { price: 59.9 }, after: { price: 49.9 } }), "tr")).toBe("price_drop");
    expect(eventAlertKind(ev({ type: "price_change", before: { price: 49.9 }, after: { price: 59.9 } }), "tr")).toBeNull();
    expect(eventAlertKind(ev({ type: "price_change", offerType: "ads", before: {}, after: {} }), "tr")).toBe("price_drop");
  });
  it("leaving, new episode vs release, ignores removals", () => {
    expect(eventAlertKind(ev({ type: "leaving_announced", after: { leavingAt: "2026-11-08" } }), "tr")).toBe("leaving");
    expect(eventAlertKind(ev({ type: "added", after: { offerId: 5, seasonId: 3 } }), "tr")).toBe("new_episode");
    expect(eventAlertKind(ev({ type: "added", after: { offerId: 5 } }), "tr")).toBe("release");
    expect(eventAlertKind(ev({ type: "removed" }), "tr")).toBeNull();
  });
});

describe("time", () => {
  it("uses Istanbul local time", () => {
    expect(istanbulParts(new Date("2026-11-06T15:30:00Z"))).toEqual({ dayKey: "2026-11-06", weekday: 5, hour: 18 });
    expect(isDigestWindow(new Date("2026-11-06T15:30:00Z"))).toBe(true);
    expect(isDigestWindow(new Date("2026-11-06T16:30:00Z"))).toBe(false);
    expect(isDigestWindow(new Date("2026-11-05T15:30:00Z"))).toBe(false);
    // 22:30 UTC on the 5th is already the 6th in Istanbul
    expect(sameLocalDay(new Date("2026-11-05T22:30:00Z"), new Date("2026-11-06T08:00:00Z"))).toBe(true);
  });
});

describe("planTelegram", () => {
  it("sends one message per alert, grouping its events, only after lastSentAt", () => {
    const events = [ev({ occurredAt: h(-30) }), ev({ type: "leaving_announced", after: { leavingAt: "2026-11-20" }, occurredAt: h(-3) }), ev({ occurredAt: h(-1) })];
    const { messages } = planTelegram({ users: [user()], alerts: [alert({ lastSentAt: h(-24) })], events, now, langForCountry: lang });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.matches.map((m) => m.kind)).toEqual(["leaving", "dub_available"]);
  });

  it("ignores kinds the user does not follow, other countries and future events", () => {
    const events = [ev({ countryCode: "US" }), ev({ occurredAt: h(1) }), ev({ type: "leaving_announced" })];
    const { messages } = planTelegram({ users: [user()], alerts: [alert({ kinds: ["dub_available"] })], events, now, langForCountry: lang });
    expect(messages).toHaveLength(0);
  });

  it("caps at 3 messages per user per local day; the rest are deferred", () => {
    const alerts = [1, 2, 3, 4, 5].map((i) => alert({ id: i, titleId: i }));
    const events = [1, 2, 3, 4, 5].map((i) => ev({ titleId: i, occurredAt: h(-10 + i) }));
    const r = planTelegram({ users: [user()], alerts, events, now, langForCountry: lang });
    expect(r.messages.map((m) => m.titleId)).toEqual([1, 2, 3]);
    expect(r.deferred.map((d) => d.alertId)).toEqual([4, 5]);
  });

  it("counts messages already sent today against the cap", () => {
    const sent = [10, 11].map((i) => alert({ id: i, titleId: i, lastSentAt: h(-1) }));
    const pending = [1, 2].map((i) => alert({ id: i, titleId: i }));
    const events = [1, 2].map((i) => ev({ titleId: i }));
    const r = planTelegram({ users: [user()], alerts: [...sent, ...pending], events, now, langForCountry: lang });
    expect(r.messages).toHaveLength(1);
    expect(r.deferred).toEqual([{ userId: "u1", alertId: 2, reason: "daily_cap" }]);
  });

  it("skips users without a linked Telegram chat and email alerts", () => {
    const r = planTelegram({ users: [user({ telegramId: null })], alerts: [alert()], events: [ev({})], now, langForCountry: lang });
    expect(r.messages).toHaveLength(0);
    const r2 = planTelegram({ users: [user()], alerts: [alert({ channel: "email" })], events: [ev({})], now, langForCountry: lang });
    expect(r2.messages).toHaveLength(0);
  });
});

describe("planDigest", () => {
  const friday = new Date("2026-11-06T15:10:00Z");
  it("groups pending matches and adds this week's general dubs", () => {
    const events = [
      ev({ titleId: 1, occurredAt: h(-5) }),
      ev({ titleId: 1, type: "leaving_announced", after: { leavingAt: "2026-11-20" }, occurredAt: h(-4) }),
      ev({ titleId: 7, titleName: "Moana 2", serviceName: "Disney+", occurredAt: h(-6) }),
      ev({ titleId: 8, occurredAt: new Date("2026-10-20T10:00:00Z") }),
    ];
    const plans = planDigest({ users: [user({ email: "a@b.co", telegramId: null })], alerts: [alert({ channel: "email" })], events, now: friday, langForCountry: lang });
    expect(plans).toHaveLength(1);
    const p = plans[0]!;
    expect(p.channel).toBe("email");
    expect(p.alertIds).toEqual([1]);
    expect(p.sections.dubs).toHaveLength(1);
    expect(p.sections.leaving).toHaveLength(1);
    expect(p.newDubs.map((e) => e.titleId)).toEqual([7]);
  });

  it("skips users with nothing to say", () => {
    expect(planDigest({ users: [user({ email: "a@b.co" })], alerts: [], events: [], now: friday, langForCountry: lang })).toEqual([]);
  });
});

describe("format", () => {
  it("adds UTM parameters", () => {
    expect(withUtm("https://sofo.tv/tr/dizi/arcane", "telegram", "dub_available")).toBe(
      "https://sofo.tv/tr/dizi/arcane?utm_source=telegram&utm_medium=alert&utm_campaign=dub_available",
    );
  });
  it("writes deterministic headlines", () => {
    const ctx = { lang: "tr", currency: "TRY" };
    expect(eventHeadline("dub_available", ev({}), ctx)).toBe("Arcane is now in Turkish on Netflix");
    expect(eventHeadline("price_drop", ev({ type: "price_change", before: { price: 59.9 }, after: { price: 49.9 } }), ctx)).toBe("Arcane is cheaper on Netflix: ₺59.9 → ₺49.9");
    expect(eventHeadline("leaving", ev({ type: "leaving_announced", after: { leavingAt: "2026-11-08T00:00:00Z" } }), ctx)).toBe("Arcane leaves Netflix on 8 Nov");
  });
  const ctx = { siteUrl: "https://sofo.tv", lang: "tr", countryName: "Türkiye", currency: "TRY", myListPath: "/tr/listem" };
  it("escapes Telegram HTML and always offers mute", () => {
    const m = telegramMessage({ userId: "u1", chatId: "100", alertId: 1, titleId: 1, matches: [{ alertId: 1, kind: "dub_available", event: ev({ titleName: "Tom & <Jerry>" }) }] }, ctx);
    expect(m.text).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(m.buttons.at(-1)!.text).toBe("Mute / manage");
  });
  it("builds a digest email with unsubscribe text", () => {
    const e = digestEmail(
      { userId: "u1", channel: "email", to: "a@b.co", alertIds: [1], sections: { dubs: [{ alertId: 1, kind: "dub_available", event: ev({}) }], leaving: [], prices: [], episodes: [], releases: [] }, newDubs: [] },
      ctx,
      new Date("2026-11-06T15:00:00Z"),
    );
    expect(e.subject).toBe("1 new Turkish dub");
    expect(e.text).toContain("unsubscribe");
    expect(e.html).toContain("utm_source=email");
  });
});

describe("validate", () => {
  it("parses contacts", () => {
    expect(parseContact(" Me@Mail.com ")).toEqual({ channel: "email", email: "me@mail.com" });
    expect(parseContact("@Sofo_Fan")).toEqual({ channel: "telegram", handle: "sofo_fan" });
    expect(parseContact("https://t.me/sofo_fan")).toEqual({ channel: "telegram", handle: "sofo_fan" });
    expect(parseContact("abc")).toBeNull();
    expect(parseContact("a@b")).toBeNull();
  });
  it("validates and merges alert requests", () => {
    const r = parseSubscribeInput({ contact: "a@b.co", edition: "tr", alerts: [{ titleId: 1, kinds: ["leaving"] }, { titleId: 1, kinds: ["dub_available"] }] });
    expect(r.ok && r.value.alerts).toEqual([{ titleId: 1, kinds: ["leaving", "dub_available"] }]);
    expect(parseSubscribeInput({ contact: "a@b.co", edition: "tr", alerts: [{ titleId: 1, kinds: ["nope"] }] }).ok).toBe(false);
    expect(parseSubscribeInput({ contact: "a@b.co", edition: "tr", website: "spam" }).ok).toBe(false);
    expect(mergeKinds(["leaving"], ["leaving", "price_drop"])).toEqual(["leaving", "price_drop"]);
  });
  it("checks same origin", () => {
    expect(isSameOrigin("https://sofo.tv", "x.vercel.app", "https://sofo.tv")).toBe(true);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000", undefined)).toBe(true);
    expect(isSameOrigin("https://evil.com", "sofo.tv", "https://sofo.tv")).toBe(false);
    expect(isSameOrigin(null, "sofo.tv", "https://sofo.tv")).toBe(false);
  });
  it("signs user refs (Telegram deep-link safe)", () => {
    const t = signUserRef("cmw3k2isc000103pl07594r5u", "k");
    expect(t).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    expect(verifyUserRef(t, "k")).toBe("cmw3k2isc000103pl07594r5u");
    expect(verifyUserRef(t, "other")).toBeNull();
    expect(verifyUserRef("cmw3k2isc000103pl07594r5u_forged", "k")).toBeNull();
  });
});

describe("itemStatus", () => {
  const o = (x: Partial<FreshOffer>): FreshOffer => ({
    serviceSlug: "netflix", serviceName: "Netflix", logoPath: null, type: "subscription", price: null, currency: null, url: "https://netflix.com",
    audio: "unknown", subtitle: "unknown", leavingAt: null, checkedAt: now.toISOString(), ...x,
  });
  const opts = { myServices: ["netflix"], lang: "tr", countryName: "Türkiye", now };
  it("never guesses language", () => {
    expect(itemStatus({ offers: [o({ audio: "confirmed_yes" })] }, opts).label).toBe("On Netflix · TR dub");
    expect(itemStatus({ offers: [o({ subtitle: "confirmed_yes" })] }, opts).label).toBe("On Netflix · TR sub only");
    expect(itemStatus({ offers: [o({})] }, opts).label).toBe("On Netflix · TR audio not confirmed");
  });
  it("leaving, free and not available", () => {
    expect(itemStatus({ offers: [o({ leavingAt: "2026-11-10T00:00:00Z" })] }, opts).label).toBe("Leaves Netflix in 5 days");
    expect(itemStatus({ offers: [o({ serviceSlug: "tabii", serviceName: "tabii", type: "ads" })] }, opts).label).toBe("Free with ads on tabii");
    expect(itemStatus({ offers: [] }, opts)).toMatchObject({ tone: "muted", label: "Not in Türkiye yet — we'll tell you" });
  });
});
