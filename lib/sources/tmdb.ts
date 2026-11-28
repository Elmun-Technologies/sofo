/**
 * TMDB v3 client — metadata, localized names/overviews, official YouTube videos, collections.
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 *
 * Every request goes through fetchJson (retry/backoff + per-host rate limit). The API key travels
 * in the query string, so errors are re-thrown without the URL — keys never reach logs.
 */
import { fetchJson, HttpError, SourceConfigError } from "./http";

const BASE = "https://api.themoviedb.org/3";
const APPEND = "videos,alternative_titles,external_ids,credits";
/** Age ratings ride on the same request: movies carry them per release, series per country. */
const APPEND_MOVIE = `${APPEND},release_dates`;
const APPEND_TV = `${APPEND},content_ratings`;

export type TmdbLanguage = "tr-TR" | "en-US";

export type TmdbVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  iso_639_1?: string;
  iso_3166_1?: string;
  published_at?: string;
};

export type TmdbAlternativeTitle = { iso_3166_1: string; title: string; type?: string };

type TmdbBase = {
  id: number;
  overview: string;
  original_language: string;
  popularity?: number;
  vote_average?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { id: number; name: string }[];
  videos?: { results?: TmdbVideo[] };
  alternative_titles?: { titles?: TmdbAlternativeTitle[] };
  external_ids?: { imdb_id?: string | null };
  credits?: { cast?: TmdbCast[]; crew?: TmdbCrew[] };
};

export type TmdbCast = { id: number; name: string; character?: string | null; order?: number; known_for_department?: string };
export type TmdbCrew = { id: number; name: string; job?: string; department?: string; known_for_department?: string };

export type TmdbMovieDetails = TmdbBase & {
  title: string;
  original_title: string;
  release_date?: string;
  runtime?: number | null;
  belongs_to_collection?: { id: number; name: string; poster_path?: string | null } | null;
  release_dates?: { results?: { iso_3166_1: string; release_dates?: { certification?: string; type?: number }[] }[] };
};

export type TmdbSeason = {
  id: number;
  name: string;
  season_number: number;
  air_date?: string | null;
  episode_count?: number;
  poster_path?: string | null;
  vote_average?: number;
};

export type TmdbTvDetails = TmdbBase & {
  name: string;
  original_name: string;
  first_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  seasons?: TmdbSeason[];
  created_by?: { id: number; name: string }[];
  content_ratings?: { results?: { iso_3166_1: string; rating?: string }[] };
};

export type TmdbEpisode = {
  episode_number: number;
  name?: string | null;
  overview?: string | null;
  air_date?: string | null;
  runtime?: number | null;
  vote_average?: number;
  still_path?: string | null;
};

export type TmdbSeasonDetails = { season_number: number; episodes?: TmdbEpisode[] };

function apiKey(): string {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) throw new SourceConfigError("TMDB_API_KEY is not set — add it to .env.local (never commit it)");
  return key;
}

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

/**
 * TMDB accepts two credentials: the short v3 "API key" (sent as `?api_key=`) and the long
 * "API Read Access Token" (a JWT, sent as `Authorization: Bearer`). The token form keeps the secret
 * out of URLs and lets a proxy inject it as a header.
 */
export function tmdbAuth(key: string): { query?: string; headers?: Record<string, string> } {
  return key.startsWith("eyJ") ? { headers: { Authorization: `Bearer ${key}` } } : { query: key };
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) if (value !== undefined) qs.set(name, String(value));
  const auth = tmdbAuth(apiKey());
  if (auth.query) qs.set("api_key", auth.query);
  try {
    return await fetchJson<T>(`${BASE}${path}?${qs}`, { headers: auth.headers, minIntervalMs: 60 });
  } catch (err) {
    // The URL carries the API key: report the path only.
    if (err instanceof HttpError) throw new HttpError(err.status, path);
    throw err;
  }
}

export function getMovie(id: number, language: TmdbLanguage): Promise<TmdbMovieDetails> {
  return get<TmdbMovieDetails>(`/movie/${id}`, { language, append_to_response: APPEND_MOVIE });
}

export function getTv(id: number, language: TmdbLanguage): Promise<TmdbTvDetails> {
  return get<TmdbTvDetails>(`/tv/${id}`, { language, append_to_response: APPEND_TV });
}

/** One season with its episodes (names, air dates, runtimes). One request per season. */
export function getTvSeason(id: number, season: number, language: TmdbLanguage): Promise<TmdbSeasonDetails> {
  return get<TmdbSeasonDetails>(`/tv/${id}/season/${season}`, { language });
}
