/**
 * Streaming Availability API v4 (Movie of the Night) — availability + audio/subtitle languages.
 * Docs: https://docs.movieofthenight.com/resource/shows
 * Schema: https://github.com/movieofthenight/streaming-availability-api/blob/main/openapi.yaml
 *
 * Shape (per streaming option): service {id,name}, type (subscription|free|ads|rent|buy|addon),
 * link, quality, audios [{language}], subtitles [{locale:{language}}], price {amount,currency}, expiresOn.
 *
 * Responses are validated by hand (no runtime schema dependency): a malformed option is dropped and
 * the rest of the show still ingests; a malformed show throws SourceValidationError.
 */
import { fetchJson, HttpError, SourceConfigError, SourceValidationError } from "./http";

export type SaLocale = { language: string; region?: string };

export type SaStreamingOption = {
  service: { id: string; name: string };
  type: string;
  link: string;
  quality: string | null;
  audios: SaLocale[];
  subtitles: { locale: SaLocale }[];
  price: { amount: number; currency: string } | null;
  /** Unix ms — the date the option is expected to leave the service */
  expiresOn: Date | null;
};

export type SaShow = {
  itemType: "show";
  showType: "movie" | "series";
  id: string;
  imdbId: string | null;
  /** "movie/238" | "tv/1396" as returned by the API */
  tmdbId: string | null;
  originalTitle: string;
  /** Keyed by lowercase ISO 3166-1 alpha-2 country code */
  streamingOptions: Record<string, SaStreamingOption[]>;
};

type Json = Record<string, unknown>;

const isRecord = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const asText = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const asNumber = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function parseLocale(raw: unknown): SaLocale | null {
  if (!isRecord(raw)) return null;
  const language = asText(raw.language);
  if (!language) return null;
  const region = asText(raw.region);
  return region ? { language, region } : { language };
}

function parseOption(raw: unknown): SaStreamingOption | null {
  if (!isRecord(raw)) return null;
  const service = isRecord(raw.service) ? raw.service : null;
  const serviceId = asText(service?.id);
  const name = asText(service?.name) ?? serviceId;
  const type = asText(raw.type);
  const link = asText(raw.link);
  if (!serviceId || !name || !type || !link) return null;

  const audios = Array.isArray(raw.audios) ? raw.audios.map(parseLocale).filter((l): l is SaLocale => l !== null) : [];
  const subtitles = Array.isArray(raw.subtitles)
    ? raw.subtitles
        .map((s) => (isRecord(s) ? parseLocale(s.locale) : null))
        .filter((l): l is SaLocale => l !== null)
        .map((locale) => ({ locale }))
    : [];

  let price: SaStreamingOption["price"] = null;
  if (isRecord(raw.price)) {
    const amount = typeof raw.price.amount === "string" ? Number(raw.price.amount) : asNumber(raw.price.amount);
    const currency = asText(raw.price.currency);
    if (amount !== null && Number.isFinite(amount) && currency) price = { amount, currency: currency.toUpperCase() };
  }

  const expiresOnSec = asNumber(raw.expiresOn);
  return {
    service: { id: serviceId, name },
    type,
    link,
    quality: asText(raw.quality),
    audios,
    subtitles,
    price,
    expiresOn: expiresOnSec ? new Date(expiresOnSec * 1000) : null,
  };
}

/** Validates a /v4/shows/{id} payload; throws when the show itself is unusable. */
export function parseShow(raw: unknown): SaShow {
  if (!isRecord(raw)) throw new SourceValidationError("show: expected an object");
  if (raw.itemType !== undefined && raw.itemType !== "show") throw new SourceValidationError(`show: unexpected itemType ${String(raw.itemType)}`);
  const showType = raw.showType;
  if (showType !== "movie" && showType !== "series") throw new SourceValidationError(`show: unexpected showType ${String(showType)}`);

  const originalTitle = asText(raw.originalTitle);
  if (!originalTitle) throw new SourceValidationError("show: missing originalTitle");
  if (!isRecord(raw.streamingOptions)) throw new SourceValidationError("show: missing streamingOptions");

  const streamingOptions: Record<string, SaStreamingOption[]> = {};
  for (const [country, list] of Object.entries(raw.streamingOptions)) {
    if (!Array.isArray(list)) continue;
    streamingOptions[country.toLowerCase()] = list.map(parseOption).filter((o): o is SaStreamingOption => o !== null);
  }

  return {
    itemType: "show",
    showType,
    id: asText(raw.id) ?? "",
    imdbId: asText(raw.imdbId),
    tmdbId: asText(raw.tmdbId),
    originalTitle,
    streamingOptions,
  };
}

function baseUrl(): string {
  return (process.env.STREAMING_AVAILABILITY_API_URL?.trim() || "https://api.movieofthenight.com/v4").replace(/\/+$/, "");
}

function authHeaders(): Record<string, string> {
  const key = process.env.STREAMING_AVAILABILITY_API_KEY?.trim();
  if (!key) throw new SourceConfigError("STREAMING_AVAILABILITY_API_KEY is not set — add it to .env.local (never commit it)");
  // Direct API (developers.movieofthenight.com) vs the RapidAPI marketplace host.
  return baseUrl().includes("rapidapi.com")
    ? { "X-RapidAPI-Key": key, "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com" }
    : { "X-API-Key": key };
}

export function isStreamingAvailabilityConfigured(): boolean {
  return Boolean(process.env.STREAMING_AVAILABILITY_API_KEY?.trim());
}

/**
 * GET /shows/{id} — id can be an IMDb id (tt0068646), a TMDB id ("movie/238", "tv/1396") or the show id.
 * Returns null on 404 (title unknown to the API, not an error).
 */
export async function getShow(opts: {
  id: string;
  country: string;
  language?: string;
  granularity?: "show" | "season" | "episode";
}): Promise<SaShow | null> {
  const qs = new URLSearchParams({
    country: opts.country.toUpperCase(),
    output_language: opts.language ?? "en",
    series_granularity: opts.granularity ?? "show",
  });
  const path = `/shows/${encodeURIComponent(opts.id)}`;
  try {
    return parseShow(await fetchJson<unknown>(`${baseUrl()}${path}?${qs}`, { headers: authHeaders(), minIntervalMs: 120 }));
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}
