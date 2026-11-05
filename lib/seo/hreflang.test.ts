import { describe, expect, it } from "vitest";
import { buildAlternates } from "./hreflang";

describe("buildAlternates", () => {
  it("adds x-default pointing to the English page", () => {
    expect(buildAlternates("/tr/film/coco", { tr: "/tr/film/coco", en: "/en/movie/coco" })).toEqual({
      canonical: "/tr/film/coco",
      languages: { tr: "/tr/film/coco", en: "/en/movie/coco", "x-default": "/en/movie/coco" },
    });
  });
  it("falls back to the edition picker without an English page", () => {
    expect(buildAlternates("/tr", { tr: "/tr" }).languages).toEqual({ tr: "/tr", "x-default": "/" });
  });
});
