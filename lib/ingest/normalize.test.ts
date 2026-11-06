import { describe, expect, it } from "vitest";
import { SourceValidationError } from "../sources/http";
import { parseShow } from "../sources/streaming-availability";
import movieShow from "./fixtures/sa-show-movie.json";
import seriesShow from "./fixtures/sa-show-series.json";
import { normalizeLang, normalizeShow, offerKey, tmdbIdFrom } from "./normalize";

describe("normalizeLang", () => {
  it("maps ISO 639-2 codes from the API to our 2-letter codes", () => {
    expect(normalizeLang("tur")).toBe("tr");
    expect(normalizeLang("eng")).toBe("en");
    expect(normalizeLang("spa")).toBe("es");
    expect(normalizeLang("TR")).toBe("tr");
  });

  it("drops unknown/undefined languages instead of guessing", () => {
    expect(normalizeLang("und")).toBeNull();
    expect(normalizeLang("")).toBeNull();
    expect(normalizeLang("zzz")).toBeNull();
  });
});

describe("tmdbIdFrom", () => {
  it("reads the id out of the API's tmdbId", () => {
    expect(tmdbIdFrom("movie/238")).toBe(238);
    expect(tmdbIdFrom("tv/1396")).toBe(1396);
    expect(tmdbIdFrom("1396")).toBe(1396);
    expect(tmdbIdFrom(null)).toBeNull();
  });
});

describe("normalizeShow", () => {
  it("maps a TR movie to subscription/rent offers with confirmed languages", () => {
    const snapshot = normalizeShow(parseShow(movieShow), { country: "TR" });
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;

    expect(snapshot.tmdbId).toBe(1184918);
    expect(snapshot.type).toBe("movie");
    expect(snapshot.countryCode).toBe("TR");
    expect(snapshot.offers.map(offerKey)).toEqual(["netflix|subscription|uhd", "prime-video|rent|hd"]);

    const netflix = snapshot.offers.find((o) => o.serviceSlug === "netflix");
    expect(netflix?.audio.map((l) => l.lang)).toEqual(["en", "tr"]);
    expect(netflix?.audio.every((l) => l.status === "confirmed_yes")).toBe(true);
    expect(netflix?.subtitle.map((l) => l.lang)).toEqual(["en", "tr"]);
    expect(netflix?.price).toBeNull();
    expect(netflix?.leavingAt?.toISOString()).toBe("2027-01-01T00:00:00.000Z");

    const rent = snapshot.offers.find((o) => o.serviceSlug === "prime-video");
    expect(rent?.type).toBe("rent");
    expect(rent?.price).toBe(49.9);
    expect(rent?.currency).toBe("TRY");
    expect(rent?.quality).toBe("hd");
  });

  it("drops unmapped services and addon options", () => {
    const snapshot = normalizeShow(parseShow(movieShow), { country: "TR" });
    expect(snapshot?.offers.some((o) => o.serviceSlug === "apple")).toBe(false);
    expect(snapshot?.offers.every((o) => o.type !== ("addon" as typeof o.type))).toBe(true);
  });

  it("merges duplicate service/type/quality options and unions their languages", () => {
    const snapshot = normalizeShow(parseShow(seriesShow), { country: "TR" });
    expect(snapshot?.type).toBe("tv");
    const netflix = snapshot?.offers.filter((o) => o.serviceSlug === "netflix");
    expect(netflix).toHaveLength(1);
    expect(netflix?.[0]?.audio.map((l) => l.lang)).toEqual(["en", "tr"]);
    expect(netflix?.[0]?.subtitle.map((l) => l.lang)).toEqual(["en", "tr"]);
  });

  it("returns null when the show has no TMDB id to match on", () => {
    const snapshot = normalizeShow({ ...parseShow(seriesShow), tmdbId: null }, { country: "TR" });
    expect(snapshot).toBeNull();
  });

  it("rejects payloads that are not shows", () => {
    expect(() => parseShow({ showType: "movie" })).toThrow(SourceValidationError);
  });
});
