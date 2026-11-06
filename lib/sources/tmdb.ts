/**
 * TMDB v3 client — metadata, localized names/overviews, official YouTube videos, collections.
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 *
 * Every request goes through fetchJson (retry/backoff + per-host rate limit). The API key travels
 * in the query string, so errors are re-thrown without the URL — keys never reach logs.
 */
import { fetchJson, HttpError, SourceConfigError } from "./http";

const BASE = "https://api.themoviedb.org/3";
const APPEND = "videos,alternative_titles,external_ids";

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
};

export type TmdbMovieDetails = TmdbBase & {
  title: string;
  original_title: string;
  release_date?: string;
  runtime?: number | null;
  belongs_to_collection?: { id: number; name: string; poster_path?: string | null } | null;
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
};

function apiKey(): string {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) throw new SourceConfigError("TMDB_API_KEY is not set — add it to .env.local (never commit it)");
  return key;
}

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) if (value !== undefined) qs.set(name, String(value));
  qs.set("api_key", apiKey());
  try {
    return await fetchJson<T>(`${BASE}${path}?${qs}`, { minIntervalMs: 60 });
  } catch (err) {
    // The URL carries the API key: report the path only.
    if (err instanceof HttpError) throw new HttpError(err.status, path);
    throw err;
  }
}

export function getMovie(id: number, language: TmdbLanguage): Promise<TmdbMovieDetails> {
  return get<TmdbMovieDetails>(`/movie/${id}`, { language, append_to_response: APPEND });
}

export function getTv(id: number, language: TmdbLanguage): Promise<TmdbTvDetails> {
  return get<TmdbTvDetails>(`/tv/${id}`, { language, append_to_response: APPEND });
}
