import { describe, expect, it } from "vitest";
import { parseTmdbInput, posInt, SLUG_RE } from "./validate";

describe("admin validators", () => {
  it("posInt accepts plain positive int4 only", () => {
    expect(posInt("1184918")).toBe(1184918);
    expect(posInt(" 42 ")).toBe(42);
    expect(posInt("0")).toBeNull();
    expect(posInt("-3")).toBeNull();
    expect(posInt("1e5")).toBeNull();
    expect(posInt("3000000000")).toBeNull();
    expect(posInt(null)).toBeNull();
  });
  it("parseTmdbInput reads ids and TMDB URLs", () => {
    expect(parseTmdbInput("94605")).toEqual({ id: 94605 });
    expect(parseTmdbInput("https://www.themoviedb.org/tv/94605-arcane")).toEqual({ id: 94605, type: "tv" });
    expect(parseTmdbInput("legend")).toBeNull();
  });
  it("slug pattern", () => {
    expect(SLUG_RE.test("en-iyi-animasyonlar")).toBe(true);
    expect(SLUG_RE.test("Bad Slug")).toBe(false);
    expect(SLUG_RE.test("-x")).toBe(false);
  });
});
