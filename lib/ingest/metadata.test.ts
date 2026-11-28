import type { TmdbMovieDetails, TmdbTvDetails } from "../sources/tmdb";
import { describe, expect, it } from "vitest";
import enMovie from "./fixtures/tmdb-movie-en.json";
import trMovie from "./fixtures/tmdb-movie-tr.json";
import enTv from "./fixtures/tmdb-tv-en.json";
import trTv from "./fixtures/tmdb-tv-tr.json";
import { creditsOf, isGenericEpisodeName, isKidsGenres, mapEpisodes, mapMovie, mapTv, readableName } from "./metadata";
import { parseTitleCsv } from "./title-list";

const movieTr = trMovie as unknown as TmdbMovieDetails;
const movieEn = enMovie as unknown as TmdbMovieDetails;
const tvTr = trTv as unknown as TmdbTvDetails;
const tvEn = enTv as unknown as TmdbTvDetails;

describe("mapMovie", () => {
  const meta = mapMovie(movieTr, movieEn);

  it("keeps localized names/overviews and TMDB alternative titles", () => {
    expect(meta.localizations.map((l) => l.lang)).toEqual(["tr", "en"]);
    expect(meta.localizations[0]).toMatchObject({ name: "Vahşi Robot", overview: "Issız bir adaya düşen robot Roz, yetim bir kaz yavrusuna annelik etmeyi öğrenir." });
    expect(meta.localizations[0]?.altNames).toContain("The Wild Robot");
    expect(meta.localizations[1]?.name).toBe("The Wild Robot");
  });

  it("uses English genre names as the canonical vocabulary", () => {
    expect(meta.genres).toEqual(["Animation", "Family"]);
    expect(meta.isAnimation).toBe(true);
    expect(meta.isKids).toBe(true);
  });

  it("maps core metadata", () => {
    expect(meta).toMatchObject({
      tmdbId: 1184918,
      type: "movie",
      originalTitle: "The Wild Robot",
      originalLang: "en",
      year: 2024,
      runtimeMin: 102,
      tmdbScore: 8.3,
      collection: null,
    });
  });

  it("keeps official YouTube videos only, deduped by key", () => {
    expect(meta.videos).toHaveLength(1);
    expect(meta.videos[0]).toMatchObject({ key: "wildTrailer01", kind: "trailer", isOfficial: true });
    expect(meta.videos.some((v) => v.key === "fanEdit01")).toBe(false);
  });
});

describe("mapTv", () => {
  const meta = mapTv(tvTr, tvEn);

  it("maps series metadata and seasons (specials skipped)", () => {
    expect(meta).toMatchObject({ tmdbId: 1396, type: "tv", year: 2008, runtimeMin: 45 });
    expect(meta.seasons).toHaveLength(1);
    expect(meta.seasons[0]).toMatchObject({ number: 1, name: "1. Sezon", episodeCount: 7, tmdbScore: 8.9 });
    expect(meta.seasons[0]?.airDate?.toISOString()).toBe("2008-01-20T00:00:00.000Z");
  });

  it("keeps canonical genres from the English payload", () => {
    expect(meta.genres).toEqual(["Drama", "Crime"]);
  });
});

describe("parseTitleCsv", () => {
  it("reads tmdb_id,type rows, skipping comments, the header and duplicates", () => {
    const rows = parseTitleCsv(["# watchlist", "tmdb_id,type", "1396,tv", "1184918,movie", "1396,tv", ""].join("\n"));
    expect(rows).toEqual([
      { tmdbId: 1396, type: "tv" },
      { tmdbId: 1184918, type: "movie" },
    ]);
  });

  it("refuses rows it cannot trust", () => {
    expect(() => parseTitleCsv("abc,movie")).toThrow(/invalid tmdb_id/);
    expect(() => parseTitleCsv("1396,series")).toThrow(/type must be/);
  });
});

describe("isKidsGenres", () => {
  it("keeps Turkish family dramas out of the kids sections", () => {
    expect(isKidsGenres(["Drama", "Family", "Romance"])).toBe(false);
    expect(isKidsGenres(["Family", "Animation", "Adventure"])).toBe(true);
    expect(isKidsGenres(["Family", "Comedy"])).toBe(true);
    expect(isKidsGenres(["Kids", "Drama"])).toBe(true);
    expect(isKidsGenres(["Animation", "Comedy"])).toBe(false);
  });
});

describe("readableName", () => {
  it("falls back to the English title when the local one is not in Latin script", () => {
    expect(readableName("ドラゴンボール超 ビルス", "Dragon Ball Super: Beerus", "ドラゴンボール超 ビルス")).toBe("Dragon Ball Super: Beerus");
    expect(readableName("Şeytan Marka Giyer 2", "The Devil Wears Prada 2", "The Devil Wears Prada 2")).toBe("Şeytan Marka Giyer 2");
    expect(readableName(null, "Ghosts", "Ghosts")).toBe("Ghosts");
  });
});

describe("creditsOf", () => {
  it("puts directors first, then billed cast, without duplicates", () => {
    const credits = creditsOf(
      {
        credits: {
          crew: [
            { id: 1, name: "Denis Villeneuve", job: "Director" },
            { id: 1, name: "Denis Villeneuve", job: "Director" },
            { id: 9, name: "Hans Zimmer", job: "Original Music Composer" },
          ],
          cast: [
            { id: 3, name: "Zendaya", character: "Chani", order: 1 },
            { id: 2, name: "Timothée Chalamet", character: "Paul Atreides", order: 0 },
          ],
        },
      },
      "movie",
    );
    expect(credits.map((c) => `${c.job}:${c.name}`)).toEqual(["Director:Denis Villeneuve", "Actor:Timothée Chalamet", "Actor:Zendaya"]);
    expect(credits[1]?.character).toBe("Paul Atreides");
  });
  it("carries the TMDB profile image (null when missing)", () => {
    const credits = creditsOf({ credits: { cast: [{ id: 3, name: "Zendaya", order: 0, profile_path: "/z.jpg" }, { id: 4, name: "No Photo", order: 1 }] } }, "movie");
    expect(credits.map((c) => c.photoPath)).toEqual(["/z.jpg", null]);
  });
  it("uses created_by as creators for series", () => {
    expect(creditsOf({ created_by: [{ id: 5, name: "Seth MacFarlane" }] }, "tv")).toEqual([
      { tmdbId: 5, name: "Seth MacFarlane", knownFor: "Writing", photoPath: null, job: "Creator", character: null, order: -1 },
    ]);
  });
});

describe("age rating and episodes", () => {
  it("reads the movie certification from release_dates (TR first)", () => {
    const tr = { ...movieTr, release_dates: { results: [{ iso_3166_1: "US", release_dates: [{ certification: "PG", type: 3 }] }, { iso_3166_1: "TR", release_dates: [{ certification: "", type: 1 }, { certification: "7+", type: 3 }] }] } };
    expect(mapMovie(tr, movieEn).ageRating).toBe("7+");
  });

  it("falls back to the US series rating and returns null when nothing is published", () => {
    const tv = { ...tvTr, content_ratings: { results: [{ iso_3166_1: "US", rating: "TV-14" }] } };
    expect(mapTv(tv, tvEn).ageRating).toBe("14+");
    expect(mapTv(tvTr, tvEn).ageRating).toBeNull();
  });

  it("replaces generic Turkish episode names with the English ones", () => {
    const eps = mapEpisodes(
      [
        { episode_number: 2, name: "2. Bölüm", air_date: "2024-06-23", runtime: 58, vote_average: 7.9 },
        { episode_number: 1, name: "Ejderhanın Mirası", air_date: "2024-06-16", runtime: 0 },
      ],
      [{ episode_number: 2, name: "Rhaenyra the Cruel" }],
    );
    expect(eps.map((e) => e.number)).toEqual([1, 2]);
    expect(eps[0]).toMatchObject({ name: "Ejderhanın Mirası", runtimeMin: null });
    expect(eps[1]).toMatchObject({ name: "Rhaenyra the Cruel", runtimeMin: 58, tmdbScore: 7.9 });
    expect(isGenericEpisodeName("Episode 4")).toBe(true);
  });
});
