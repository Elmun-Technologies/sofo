/**
 * TMDB payloads → TitleMetadata (pure). No DB, no slugs: the caller assigns slugs.
 * Localized copy comes from the tr-TR/en-US requests; genres use the English names as the
 * canonical filter vocabulary; videos are official YouTube only (trailer policy, CLAUDE.md).
 */
import type { VideoKind } from "@prisma/client";
import type { TmdbMovieDetails, TmdbTvDetails, TmdbVideo } from "../sources/tmdb";

export type MetadataLocalization = { lang: string; name: string; altNames: string[]; overview: string | null };

export type MetadataSeason = {
  number: number;
  name: string | null;
  airDate: Date | null;
  episodeCount: number | null;
  tmdbScore: number | null;
  posterPath: string | null;
};

export type MetadataVideo = {
  key: string;
  name: string;
  kind: VideoKind;
  lang: string | null;
  isOfficial: boolean;
  publishedAt: Date | null;
};

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
    isKids: genres.includes("Family") || genres.includes("Kids"),
    videos: videosOf(local, en),
  };
}

export function mapMovie(tr: TmdbMovieDetails, en: TmdbMovieDetails): TitleMetadata {
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
      localization("tr", tr, text(tr.title) ?? originalTitle, tr.overview),
      localization("en", en, englishName, en.overview),
    ],
    seasons: [],
  };
}

export function mapTv(tr: TmdbTvDetails, en: TmdbTvDetails): TitleMetadata {
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
      localization("tr", tr, text(tr.name) ?? originalTitle, tr.overview),
      localization("en", en, englishName, en.overview),
    ],
    seasons,
  };
}
