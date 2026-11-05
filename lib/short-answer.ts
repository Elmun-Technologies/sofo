/**
 * "Short answer" (data-model.md §4) — deterministic, template + data, no LLM.
 */
export type LangState = "confirmed_yes" | "confirmed_no" | "unknown";

export type AnswerOffer = {
  serviceSlug: string;
  serviceName: string;
  type: "subscription" | "free" | "ads" | "rent" | "buy";
  price: number | null;
  currency: string | null;
  url: string;
  /** Status of the preferred language as audio / subtitle on this offer */
  audio: LangState;
  subtitle: LangState;
};

export type ShortAnswer =
  | { kind: "yes_audio"; offer: AnswerOffer }
  | { kind: "yes_subtitle"; offer: AnswerOffer }
  | { kind: "yes_unconfirmed"; offer: AnswerOffer }
  | { kind: "rent_only"; offer: AnswerOffer }
  | { kind: "none" };

const STREAMING = new Set(["subscription", "free", "ads"]);
/** Cheapest-first order for included offers: free < ads < subscription. */
const TYPE_RANK: Record<AnswerOffer["type"], number> = { free: 0, ads: 1, subscription: 2, rent: 3, buy: 4 };

function cheapest(offers: AnswerOffer[]): AnswerOffer | undefined {
  return [...offers].sort(
    (a, b) => TYPE_RANK[a.type] - TYPE_RANK[b.type] || (a.price ?? 0) - (b.price ?? 0) || a.serviceName.localeCompare(b.serviceName),
  )[0];
}

export function computeShortAnswer(offers: AnswerOffer[]): ShortAnswer {
  const streaming = offers.filter((o) => STREAMING.has(o.type));

  const withAudio = cheapest(streaming.filter((o) => o.audio === "confirmed_yes"));
  if (withAudio) return { kind: "yes_audio", offer: withAudio };

  const withSub = cheapest(streaming.filter((o) => o.subtitle === "confirmed_yes"));
  if (withSub) return { kind: "yes_subtitle", offer: withSub };

  const anyStream = cheapest(streaming);
  if (anyStream) return { kind: "yes_unconfirmed", offer: anyStream };

  const paid = cheapest(offers.filter((o) => o.type === "rent" || o.type === "buy"));
  if (paid) return { kind: "rent_only", offer: paid };

  return { kind: "none" };
}

/** Services in the edition's core list that have no active offer for this title. */
export function notOn(offers: AnswerOffer[], coreServices: { slug: string; name: string }[]): { slug: string; name: string }[] {
  const present = new Set(offers.map((o) => o.serviceSlug));
  return coreServices.filter((s) => !present.has(s.slug));
}
