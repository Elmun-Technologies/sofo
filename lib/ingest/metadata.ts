/**
 * TMDB payloads → TitleMetadata (pure). No DB, no slugs: the caller assigns slugs.
 * Localized copy comes from the tr-TR/en-US requests; genres use the English names as the
 * canonical filter vocabulary; videos are official YouTube only (trailer policy, CLAUDE.md).
 */
import type { VideoKind } from "@prisma/client";
import type { TmdbEpisode, TmdbMovieDetails, TmdbTvDetails, TmdbVideo } from "../sources/tmdb";
import { pickAgeRating, type CountryRating } from "./age-rating";

export type MetadataLocalization = { lang: string; name: string; altNames: string[]; overview: string | null };

export type MetadataSeason = {
  number: number;
  name: string | null;
  airDate: Date | null;
  episodeCount: number | null;
  tmdbScore: number | null;
  posterPath: string | null;
  /** Absent when the season details were not fetched — then stored episodes are left untouched. */
  episodes?: MetadataEpisode[];
};

export type MetadataEpisode = {
  number: number;
  name: string | null;
  airDate: Date | null;
  runtimeMin: number | null;
  tmdbScore: number | null;
  stillPath: string | null;
};

export type MetadataVideo = {
  key: string;
  name: string;
  kind: VideoKind;
  lang: string | null;
  isOfficial: boolean;
  publishedAt: Date | null;
};

/** One person on a title. Directors/creators sort first (order −1), then billed cast. */
export type MetadataCredit = { tmdbId: number; name: string; knownFor: string | null; job: "Actor" | "Director" | "Creator"; character: string | null; order: number };

export type TitleMetadata = {
  tmdbId: number;
  type: "movie" | "tv";
  originalTitle: string;
  originalLang: string;
  year: number | null;
  runtimeMin: number | null;
  tmdbScore: number | null;
  popularity: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  genres: string[];
  isAnimation: boolean;
  /** TMDB genre heuristic for section placement — not an availability claim. */
  isKids: boolean;
  collection: { tmdbId: number; name: string } | null;
  localizations: MetadataLocalization[];
  seasons: MetadataSeason[];
  videos: MetadataVideo[];
  /** Absent in payloads from older runners — then existing credits are left untouched. */
  credits?: MetadataCredit[];
  /** "13+" style (lib/ingest/age-rating.ts); absent = leave the stored value, null = no rating published. */
  ageRating?: string | null;
};

type TmdbCommon = {
  genres?: { id: number; name: string }[];
  videos?: { results?: TmdbVideo[] };
  alternative_titles?: { titles?: { iso_3166_1: string; title: string }[] };
};

const text = (value: string | null | undefined): string | null => {
  const t = value?.trim();
  return t ? t : null;
};

const yearOf = (date: string | null | undefined): number | null => {
  const match = /^(\d{4})/.exec(date ?? "");
  return match?.[1] ? Number(match[1]) : null;
};

const dateOf = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const scoreOf = (value: number | undefined): number | null => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);

function genresOf(local: TmdbCommon, en: TmdbCommon): string[] {
  const source = en.genres?.length ? en.genres : (local.genres ?? []);
  const names = source.map((g) => text(g.name)).filter((n): n is string => !!n);
  return [...new Set(names)];
}

/** Genres that keep a "Family" title out of the kids sections (e.g. Turkish family dramas). */
const ADULT_GENRES = ["Drama", "Romance", "Crime", "Thriller", "Horror", "War", "War & Politics", "Soap", "Mystery"];

/**
 * Kids-section heuristic (placement, not an availability claim): TMDB "Kids", or "Family" that is either
 * animated or carries no adult genre. A plain "Family" tag also marks romance/family dramas.
 */
export function isKidsGenres(genres: readonly string[]): boolean {
  if (genres.includes("Kids")) return true;
  if (!genres.includes("Family")) return false;
  return genres.includes("Animation") || !genres.some((g) => ADULT_GENRES.includes(g));
}

const LATIN = /[A-Za-z\u00C0-\u024F]/;

/**
 * Display name for a Latin-script edition: TMDB returns the original script (e.g. Japanese) when no
 * Turkish title exists — fall back to the English title so cards and slugs stay readable.
 */
export function readableName(localName: string | null, englishName: string, originalTitle: string): string {
  if (localName && LATIN.test(localName)) return localName;
  if (LATIN.test(englishName)) return englishName;
  return localName || englishName || originalTitle;
}

function localization(lang: string, data: TmdbCommon, primary: string, overview: string | null | undefined): MetadataLocalization {
  const altNames: string[] = [];
  const seen = new Set([primary.toLowerCase()]);
  for (const alt of data.alternative_titles?.titles ?? []) {
    const name = text(alt.title);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    altNames.push(name);
    if (altNames.length >= 10) break;
  }
  return { lang, name: primary, altNames, overview: text(overview) };
}

const VIDEO_KINDS: Record<string, VideoKind> = {
  trailer: "trailer",
  teaser: "teaser",
  clip: "clip",
  featurette: "featurette",
  "behind the scenes": "featurette",
};

/** TMDB videos → official YouTube embeds, deduped by key. Fan uploads and other sites are dropped. */
function videosOf(local: TmdbCommon, en: TmdbCommon): MetadataVideo[] {
  const out = new Map<string, MetadataVideo>();
  for (const video of [...(local.videos?.results ?? []), ...(en.videos?.results ?? [])]) {
    if (video.site !== "YouTube" || video.official !== true) continue;
    const kind = VIDEO_KINDS[(video.type ?? "").toLowerCase()];
    const key = text(video.key);
    if (!kind || !key || out.has(key)) continue;
    const published = video.published_at ? new Date(video.published_at) : null;
    out.set(key, {
      key,
      name: text(video.name) ?? "Official video",
      kind,
      lang: text(video.iso_639_1),
      isOfficial: true,
      publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
    });
  }
  return [...out.values()];
}

const MAX_CAST = 10;

/** TMDB credits → directors (movie) / creators (tv) + top-billed cast. English names (Latin script). */
export function creditsOf(details: { credits?: { cast?: { id: number; name: string; character?: string | null; order?: number; known_for_department?: string }[]; crew?: { id: number; name: string; job?: string; known_for_department?: string }[] }; created_by?: { id: number; name: string }[] }, type: "movie" | "tv"): MetadataCredit[] {
  const out: MetadataCredit[] = [];
  const seen = new Set<string>();
  const push = (c: MetadataCredit) => {
    const key = `${c.tmdbId}:${c.job}`;
    if (!c.name || seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };
  const leads = type === "movie" ? (details.credits?.crew ?? []).filter((c) => c.job === "Director").slice(0, 2) : (details.created_by ?? []).slice(0, 2);
  for (const d of leads) push({ tmdbId: d.id, name: d.name, knownFor: type === "movie" ? "Directing" : "Writing", job: type === "movie" ? "Director" : "Creator", character: null, order: -1 });
  const cast = [...(details.credits?.cast ?? [])].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).slice(0, MAX_CAST);
  for (const c of cast) push({ tmdbId: c.id, name: c.name, knownFor: c.known_for_department ?? "Acting", job: "Actor", character: text(c.character), order: c.order ?? 999 });
  return out;
}

function baseMeta(local: TmdbMovieDetails | TmdbTvDetails, en: TmdbMovieDetails | TmdbTvDetails, type: TitleMetadata["type"]) {
  const genres = genresOf(local, en);
  return {
    tmdbId: local.id,
    type,
    originalLang: text(local.original_language) ?? "und",
    tmdbScore: scoreOf(local.vote_average),
    popularity: typeof local.popularity === "number" ? local.popularity : null,
    posterPath: text(local.poster_path),
    backdropPath: text(local.backdrop_path),
    genres,
    isAnimation: genres.includes("Animation"),
    isKids: isKidsGenres(genres),
    videos: videosOf(local, en),
  };
}

/** Movie certifications: one per country, theatrical/digital releases first. */
export function movieRatings(d: TmdbMovieDetails): CountryRating[] {
  return (d.release_dates?.results ?? []).flatMap((r) => {
    const sorted = [...(r.release_dates ?? [])].sort((a, b) => rank(a.type) - rank(b.type));
    const cert = sorted.map((x) => text(x.certification)).find((c): c is string => !!c);
    return cert ? [{ country: r.iso_3166_1, rating: cert }] : [];
  });
}
const rank = (type: number | undefined) => (type === 3 ? 0 : type === 4 ? 1 : type === 2 ? 2 : 3);

export function tvRatings(d: TmdbTvDetails): CountryRating[] {
  return (d.content_ratings?.results ?? []).flatMap((r) => {
    const rating = text(r.rating);
    return rating ? [{ country: r.iso_3166_1, rating }] : [];
  });
}

/** Generic episode names ("3. Bölüm", "Episode 3") carry no information — the English name is used instead. */
const GENERIC_EPISODE = /^(\d+\.\s*bölüm|bölüm\s*\d+|episode\s*\d+)$/i;

export function isGenericEpisodeName(name: string | null | undefined): boolean {
  const t = text(name);
  return !t || GENERIC_EPISODE.test(t);
}

/** TMDB season episodes (local + optional English) → MetadataEpisode[]. */
export function mapEpisodes(local: TmdbEpisode[], en: TmdbEpisode[] = []): MetadataEpisode[] {
  const english = new Map(en.map((e) => [e.episode_number, e]));
  return local
    .filter((e) => Number.isInteger(e.episode_number) && e.episode_number > 0)
    .map((e) => {
      const localName = text(e.name);
      const enName = text(english.get(e.episode_number)?.name);
      const name = !isGenericEpisodeName(localName) ? localName : !isGenericEpisodeName(enName) ? enName : localName;
      return {
        number: e.episode_number,
        name,
        airDate: dateOf(e.air_date ?? null),
        runtimeMin: typeof e.runtime === "number" && e.runtime > 0 ? e.runtime : null,
        tmdbScore: scoreOf(e.vote_average),
        stillPath: text(e.still_path),
      };
    })
    .sort((a, b) => a.number - b.number);
}

export function mapMovie(tr: TmdbMovieDetails, en: TmdbMovieDetails, country = "TR"): TitleMetadata {
  const base = baseMeta(tr, en, "movie");
  const originalTitle = text(tr.original_title) ?? text(tr.title) ?? "";
  const englishName = text(en.title) ?? originalTitle;
  return {
    ...base,
    originalTitle,
    year: yearOf(tr.release_date),
    runtimeMin: typeof tr.runtime === "number" && tr.runtime > 0 ? tr.runtime : null,
    collection: tr.belongs_to_collection ? { tmdbId: tr.belongs_to_collection.id, name: tr.belongs_to_collection.name } : null,
    localizations: [
      localization("tr", tr, readableName(text(tr.title), englishName, originalTitle), tr.overview),
      localization("en", en, englishName, en.overview),
    ],
    seasons: [],
    credits: creditsOf(en, "movie"),
    ageRating: pickAgeRating([...movieRatings(tr), ...movieRatings(en)], country),
  };
}

export function mapTv(tr: TmdbTvDetails, en: TmdbTvDetails, country = "TR"): TitleMetadata {
  const base = baseMeta(tr, en, "tv");
  const originalTitle = text(tr.original_name) ?? text(tr.name) ?? "";
  const englishName = text(en.name) ?? originalTitle;
  const seasons: MetadataSeason[] = (tr.seasons ?? [])
    // Season 0 = specials: not part of the season pages.
    .filter((s) => s.season_number > 0)
    .map((s) => ({
      number: s.season_number,
      name: text(s.name),
      airDate: dateOf(s.air_date ?? null),
      episodeCount: typeof s.episode_count === "number" ? s.episode_count : null,
      tmdbScore: scoreOf(s.vote_average),
      posterPath: text(s.poster_path),
    }))
    .sort((a, b) => a.number - b.number);

  return {
    ...base,
    originalTitle,
    year: yearOf(tr.first_air_date),
    runtimeMin: tr.episode_run_time?.find((m) => typeof m === "number" && m > 0) ?? null,
    collection: null,
    localizations: [
      localization("tr", tr, readableName(text(tr.name), englishName, originalTitle), tr.overview),
      localization("en", en, englishName, en.overview),
    ],
    seasons,
    credits: creditsOf(en, "tv"),
    ageRating: pickAgeRating([...tvRatings(tr), ...tvRatings(en)], country),
  };
}
