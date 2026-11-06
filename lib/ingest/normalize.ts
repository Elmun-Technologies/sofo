/**
 * Streaming Availability show → normalized snapshot (pure).
 * Invariants (CLAUDE.md business rules):
 *  - a language listed by the API is `confirmed_yes`;
 *  - a language the API does not list gets NO row (= `unknown`), never `confirmed_no`;
 *  - only mapped services and real offer types (not addons) are kept;
 *  - unknown/empty language codes are dropped instead of guessed.
 */
import type { LangStatus, OfferType } from "@prisma/client";
import type { SaLocale, SaShow, SaStreamingOption } from "../sources/streaming-availability";

export type SnapshotOffer = {
  countryCode: string;
  serviceSlug: string;
  type: OfferType;
  quality: string | null;
  price: number | null;
  currency: string | null;
  url: string;
  leavingAt: Date | null;
  audio: { lang: string; status: LangStatus }[];
  subtitle: { lang: string; status: LangStatus }[];
};

export type SnapshotTitle = {
  tmdbId: number;
  type: "movie" | "tv";
  countryCode: string;
  offers: SnapshotOffer[];
};

/** Streaming Availability service id → our Service.slug (editions.coreServices). */
export const SERVICE_MAP: Record<string, string> = {
  netflix: "netflix",
  prime: "prime-video",
  disney: "disney-plus",
  hbo: "hbo-max",
  tod: "tod",
  tabii: "tabii",
  exxen: "exxen",
  gain: "gain",
};

/** ISO 639-2 (API) → ISO 639-1 (schema). Unknown codes are skipped. */
const LANG_3_TO_2: Record<string, string> = {
  tur: "tr",
  eng: "en",
  spa: "es",
  deu: "de",
  ger: "de",
  fra: "fr",
  fre: "fr",
  por: "pt",
  ara: "ar",
  rus: "ru",
  jpn: "ja",
  kor: "ko",
  ita: "it",
  hin: "hi",
  zho: "zh",
  chi: "zh",
  nld: "nl",
  dut: "nl",
  pol: "pl",
  swe: "sv",
  nor: "no",
  dan: "da",
  fin: "fi",
  ell: "el",
  gre: "el",
  heb: "he",
  ukr: "uk",
  ces: "cs",
  cze: "cs",
  ron: "ro",
  rum: "ro",
  hun: "hu",
  bul: "bg",
  srp: "sr",
  hrv: "hr",
  fas: "fa",
  per: "fa",
  urd: "ur",
  ben: "bn",
  tam: "ta",
  tel: "te",
  tha: "th",
  vie: "vi",
  ind: "id",
  msa: "ms",
  may: "ms",
  fil: "fil",
};

const TYPE_MAP: Record<string, OfferType> = {
  subscription: "subscription",
  free: "free",
  ads: "ads",
  rent: "rent",
  buy: "buy",
};

/** "tur" → "tr", "en" → "en"; null for anything that is not a known language. */
export function normalizeLang(code: string): string | null {
  const c = code.trim().toLowerCase();
  if (!c || c === "und" || c === "unknown") return null;
  if (/^[a-z]{2}$/.test(c)) return c;
  return LANG_3_TO_2[c] ?? null;
}

function languages(locales: SaLocale[]): SnapshotOffer["audio"] {
  const seen = new Set<string>();
  const out: SnapshotOffer["audio"] = [];
  for (const locale of locales) {
    const lang = normalizeLang(locale.language);
    if (!lang || seen.has(lang)) continue;
    seen.add(lang);
    // Listed by the service = confirmed. Absence is not evidence of absence (rule 3).
    out.push({ lang, status: "confirmed_yes" satisfies LangStatus });
  }
  return out.sort((a, b) => a.lang.localeCompare(b.lang));
}

const cents = (n: number) => Math.round(n * 100) / 100;

function fromOption(option: SaStreamingOption, countryCode: string): SnapshotOffer | null {
  const serviceSlug = SERVICE_MAP[option.service.id.toLowerCase()];
  const type = TYPE_MAP[option.type.toLowerCase()];
  if (!serviceSlug || !type) return null;

  return {
    countryCode,
    serviceSlug,
    type,
    quality: option.quality?.toLowerCase() ?? null,
    price: option.price ? cents(option.price.amount) : null,
    currency: option.price?.currency ?? null,
    url: option.link,
    leavingAt: option.expiresOn,
    audio: languages(option.audios),
    subtitle: languages(option.subtitles.map((s) => s.locale)),
  };
}

/** Drawer key: one Offer row per service × offer type × quality (data-model.md §2). */
export function offerKey(offer: { serviceSlug: string; type: string; quality: string | null }): string {
  return `${offer.serviceSlug}|${offer.type}|${offer.quality ?? "-"}`;
}

/** Parses the tmdb id returned by the API ("movie/238") into a number. */
export function tmdbIdFrom(value: string | null): number | null {
  if (!value) return null;
  const id = Number(value.includes("/") ? value.slice(value.lastIndexOf("/") + 1) : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Normalizes one show for one country. Returns null when the show cannot be matched to a
 * TMDB title (we never create titles from availability data alone).
 */
export function normalizeShow(show: SaShow, opts: { country: string }): SnapshotTitle | null {
  const tmdbId = tmdbIdFrom(show.tmdbId);
  if (!tmdbId) return null;
  const countryCode = opts.country.toUpperCase();

  const raw = show.streamingOptions[countryCode.toLowerCase()] ?? [];
  const merged = new Map<string, SnapshotOffer>();

  for (const option of raw) {
    const offer = fromOption(option, countryCode);
    if (!offer) continue;
    const key = offerKey(offer);
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, offer);
      continue;
    }
    // Same service/type/quality can appear twice (e.g. two tiers): keep the first link/price and
    // union the language lists.
    const audio = new Map(prev.audio.map((l) => [l.lang, l]));
    for (const l of offer.audio) audio.set(l.lang, l);
    const subtitle = new Map(prev.subtitle.map((l) => [l.lang, l]));
    for (const l of offer.subtitle) subtitle.set(l.lang, l);
    merged.set(key, {
      ...prev,
      audio: [...audio.values()].sort((a, b) => a.lang.localeCompare(b.lang)),
      subtitle: [...subtitle.values()].sort((a, b) => a.lang.localeCompare(b.lang)),
    });
  }

  return {
    tmdbId,
    type: show.showType === "series" ? "tv" : "movie",
    countryCode,
    offers: [...merged.values()].sort((a, b) => offerKey(a).localeCompare(offerKey(b))),
  };
}
