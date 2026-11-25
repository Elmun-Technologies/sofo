import { describe, expect, it } from "vitest";
import { chunk, MAX_BATCH, parseIngestBatch, PayloadError } from "./payload";

const offer = {
  countryCode: "TR",
  serviceSlug: "netflix",
  type: "subscription",
  quality: "hd",
  price: null,
  currency: null,
  url: "https://www.netflix.com/title/1",
  leavingAt: "2026-12-31T00:00:00.000Z",
  audio: [{ lang: "tr", status: "confirmed_yes" }],
  subtitle: [],
};

const meta = {
  tmdbId: 1022789,
  type: "movie",
  originalTitle: "Inside Out 2",
  originalLang: "en",
  year: 2024,
  runtimeMin: 96,
  tmdbScore: 7.5,
  popularity: 100,
  posterPath: "/p.jpg",
  backdropPath: null,
  genres: ["Animation"],
  isAnimation: true,
  isKids: true,
  collection: null,
  localizations: [{ lang: "tr", name: "Ters Yüz 2", altNames: [], overview: null }],
  seasons: [{ number: 1, name: null, airDate: "2024-06-11T00:00:00.000Z", episodeCount: 8, tmdbScore: null, posterPath: null }],
  videos: [{ key: "abc", name: "Trailer", kind: "trailer", lang: "en", isOfficial: true, publishedAt: null }],
};

describe("parseIngestBatch", () => {
  it("revives offer dates in availability snapshots", () => {
    const batch = parseIngestBatch({ kind: "availability", items: [{ tmdbId: 1, type: "movie", countryCode: "TR", offers: [offer] }] });
    expect(batch.kind).toBe("availability");
    const leaving = batch.kind === "availability" ? batch.items[0]!.offers[0]!.leavingAt : null;
    expect(leaving).toBeInstanceOf(Date);
    expect(leaving?.toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("revives season and video dates in metadata (round trip through JSON)", () => {
    const batch = parseIngestBatch(JSON.parse(JSON.stringify({ kind: "metadata", items: [meta] })));
    if (batch.kind !== "metadata") throw new Error("kind");
    expect(batch.items[0]!.seasons[0]!.airDate).toBeInstanceOf(Date);
    expect(batch.items[0]!.videos[0]!.publishedAt).toBeNull();
  });

  it("rejects unknown kinds, bad ids, bad dates and oversized batches", () => {
    expect(() => parseIngestBatch({ kind: "drop", items: [] })).toThrow(PayloadError);
    expect(() => parseIngestBatch({ kind: "known", items: [{ tmdbId: -1, type: "movie" }] })).toThrow(/invalid tmdbId/);
    expect(() => parseIngestBatch({ kind: "availability", items: [{ tmdbId: 1, type: "movie", countryCode: "TR", offers: [{ ...offer, leavingAt: "soon" }] }] })).toThrow(/invalid date/);
    expect(() => parseIngestBatch({ kind: "availability", items: [{ tmdbId: 1, type: "movie", countryCode: "tr", offers: [] }] })).toThrow(/countryCode/);
    const many = Array.from({ length: MAX_BATCH.metadata + 1 }, () => meta);
    expect(() => parseIngestBatch({ kind: "metadata", items: many })).toThrow(/too many items/);
  });

  it("chunks lists into request-sized batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
