/** My list: shapes served by GET /api/titles and the per-item status pill. Pure, client-safe. */
import type { TitleCard } from "../catalog";
import type { LangState } from "../short-answer";
import type { AlertKindName } from "./kinds";

export type FreshOffer = {
  serviceSlug: string;
  serviceName: string;
  logoPath: string | null;
  type: string;
  price: number | null;
  currency: string | null;
  url: string;
  audio: LangState;
  subtitle: LangState;
  leavingAt: string | null;
  checkedAt: string;
};

export type FreshTitle = Omit<TitleCard, "services"> & {
  href: string;
  services: TitleCard["services"];
  offers: FreshOffer[];
  /** Latest check across active offers */
  checkedAt: string | null;
};

export type ListEvent = {
  id: string;
  titleId: number;
  titleName: string;
  href: string | null;
  kind: AlertKindName | null;
  headline: string;
  occurredAt: string;
};

export type TitlesResponse = { titles: FreshTitle[]; events?: ListEvent[] };

export type StatusTone = "available" | "leaving" | "free" | "muted";
export type ItemStatus = { tone: StatusTone; label: string; check?: boolean; offer: FreshOffer | null; onMyServices: boolean };

const DAY = 86_400_000;
const STREAM = new Set(["subscription", "free", "ads"]);
const LANG_SHORT: Record<string, string> = { tr: "TR" };

/** Best offer to show: on my services first, then streaming over rent/buy, then confirmed dub, then cheapest. */
export function bestOffer(offers: FreshOffer[], myServices: string[]): FreshOffer | null {
  const score = (o: FreshOffer) =>
    (myServices.includes(o.serviceSlug) ? 0 : 1000) + (STREAM.has(o.type) ? 0 : 100) + (o.audio === "confirmed_yes" ? 0 : o.subtitle === "confirmed_yes" ? 10 : 20) + Math.min(9, (o.price ?? 0) / 100);
  return [...offers].sort((a, b) => score(a) - score(b))[0] ?? null;
}

/**
 * Status pill for a saved title, e.g. "On Netflix · TR dub ✓", "Leaves Disney+ in 5 days",
 * "Free with ads on tabii", "Not in Türkiye yet — we'll tell you". Language is never guessed.
 */
export function itemStatus(t: Pick<FreshTitle, "offers">, opts: { myServices: string[]; lang: string; countryName: string; now?: Date }): ItemStatus {
  const now = opts.now ?? new Date();
  const lang = LANG_SHORT[opts.lang] ?? opts.lang.toUpperCase();
  const offer = bestOffer(t.offers, opts.myServices);
  if (!offer) return { tone: "muted", label: `Not in ${opts.countryName} yet — we'll tell you`, offer: null, onMyServices: false };
  const onMyServices = t.offers.some((o) => opts.myServices.includes(o.serviceSlug));

  const leaving = t.offers
    .filter((o) => o.leavingAt)
    .map((o) => ({ o, days: Math.ceil((new Date(o.leavingAt!).getTime() - now.getTime()) / DAY) }))
    .filter((x) => x.days >= 0 && x.days <= 30)
    .sort((a, b) => a.days - b.days)[0];
  if (leaving) {
    const when = leaving.days === 0 ? "today" : leaving.days === 1 ? "tomorrow" : `in ${leaving.days} days`;
    return { tone: "leaving", label: `Leaves ${leaving.o.serviceName} ${when}`, offer: leaving.o, onMyServices };
  }

  if (offer.type === "free" || offer.type === "ads") {
    return { tone: "free", label: `${offer.type === "ads" ? "Free with ads" : "Free"} on ${offer.serviceName}`, offer, onMyServices };
  }

  const verb = offer.type === "rent" ? "Rent on" : offer.type === "buy" ? "Buy on" : "On";
  if (offer.audio === "confirmed_yes") return { tone: "available", label: `${verb} ${offer.serviceName} · ${lang} dub`, check: true, offer, onMyServices };
  if (offer.subtitle === "confirmed_yes") return { tone: "muted", label: `${verb} ${offer.serviceName} · ${lang} sub only`, offer, onMyServices };
  return { tone: "muted", label: `${verb} ${offer.serviceName} · ${lang} audio not confirmed`, offer, onMyServices };
}
