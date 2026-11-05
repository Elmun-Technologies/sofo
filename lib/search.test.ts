import { describe, expect, it } from "vitest";
import { foldQuery, likeEscape, normalizeQuery, parseAudio, parseQuery } from "./search";

describe("normalizeQuery (SearchStat key)", () => {
  it("trims, collapses spaces and lowercases Turkish-aware", () => {
    expect(normalizeQuery("  Vahşi   ROBOT ")).toBe("vahşi robot");
    expect(normalizeQuery("İSTANBUL")).toBe("istanbul");
    expect(normalizeQuery("KIRMIZI")).toBe("kırmızı");
  });
  it("strips control characters and caps length", () => {
    expect(normalizeQuery("a\u0000b\nc")).toBe("a b c");
    expect(normalizeQuery("x".repeat(500))).toHaveLength(100);
  });
  it("returns empty string for whitespace", () => {
    expect(normalizeQuery("   ")).toBe("");
  });
});

describe("foldQuery (matching key)", () => {
  it("folds Turkish letters", () => {
    expect(foldQuery("Vahşi Robot")).toBe("vahsi robot");
    expect(foldQuery("vahsi robot")).toBe("vahsi robot");
    expect(foldQuery("Ruhların Kaçışı")).toBe("ruhlarin kacisi");
    expect(foldQuery("Kurtlar Vadisi")).toBe("kurtlar vadisi");
    expect(foldQuery("ÇĞİÖŞÜ çğıöşü")).toBe("cgiosu cgiosu");
  });
  it("strips other diacritics", () => {
    expect(foldQuery("Timothée Chalamet")).toBe("timothee chalamet");
    expect(foldQuery("Pokémon")).toBe("pokemon");
  });
  it("drops apostrophes and turns punctuation into spaces", () => {
    expect(foldQuery("Lupita Nyong'o")).toBe("lupita nyongo");
    expect(foldQuery("Spider-Man: Across the Spider-Verse")).toBe("spider man across the spider verse");
    expect(foldQuery("  %_ ")).toBe("");
  });
  it("keeps non-Latin scripts intact", () => {
    expect(foldQuery("進撃の巨人")).toBe("進撃の巨人");
    expect(foldQuery("ワンピース")).toBe("ワンピース");
    expect(foldQuery("오징어 게임")).toBe("오징어 게임");
  });
});

describe("parseQuery", () => {
  it("removes watch-intent words and detects the audio hint", () => {
    expect(parseQuery("Arcane Türkçe Dublaj")).toEqual({ display: "arcane türkçe dublaj", match: "arcane", audioHint: "dub" });
    expect(parseQuery("vahşi robot nerede izlenir").match).toBe("vahsi robot");
    expect(parseQuery("one piece türkçe altyazılı").audioHint).toBe("sub");
  });
  it("drops season / episode markers", () => {
    expect(parseQuery("arcan 2 sezon").match).toBe("arcan");
    expect(parseQuery("stranger things season 4").match).toBe("stranger things");
  });
  it("keeps the query when it only has intent words", () => {
    expect(parseQuery("türkçe dublaj").match).toBe("turkce dublaj");
  });
  it("has no audio hint for plain titles", () => {
    expect(parseQuery("Kung Fu Panda 4")).toEqual({ display: "kung fu panda 4", match: "kung fu panda 4", audioHint: null });
  });
});

describe("helpers", () => {
  it("escapes LIKE wildcards", () => {
    expect(likeEscape("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });
  it("parses the audio filter", () => {
    expect(parseAudio("dub")).toBe("dub");
    expect(parseAudio("sub")).toBe("sub");
    expect(parseAudio("any")).toBeUndefined();
    expect(parseAudio(["dub"])).toBeUndefined();
  });
});
