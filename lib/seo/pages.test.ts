import { describe, expect, it } from "vitest";
import { EDITIONS } from "../editions";
import { buildPageInventory, REASON, summarizeInventory, type InventoryData, type InventoryTitle } from "./pages";

const tr = EDITIONS.tr!;
const now = new Date("2026-11-05T12:00:00Z");
const checked = new Date("2026-11-04T09:00:00Z");

const title = (over: Partial<InventoryTitle> = {}): InventoryTitle => ({
  id: 1,
  tmdbId: 1184918,
  type: "movie",
  year: 2024,
  posterPath: "/p.jpg",
  updatedAt: new Date("2026-11-01T00:00:00Z"),
  loc: { name: "Vahşi Robot", overview: "…", slug: "vahsi-robot" },
  offerCheckedAt: [checked],
  seasonNumbers: [],
  ...over,
});

const data = (over: Partial<InventoryData> = {}): InventoryData => ({
  lastIngestAt: checked,
  services: [],
  lists: [],
  franchises: [],
  titles: [],
  persons: [],
  ...over,
});

describe("buildPageInventory", () => {
  it("lists edition routes; search and my list are noindex", () => {
    const pages = buildPageInventory(tr, data(), now);
    const byPath = new Map(pages.map((p) => [p.path, p]));
    expect(byPath.get("/tr")?.index).toBe(true);
    expect(byPath.get("/tr/turkce-dublaj")?.type).toBe("lang_hub");
    expect(byPath.get("/tr/ara")).toMatchObject({ index: false, reasons: [REASON.utility] });
    expect(byPath.get("/tr/listem")?.index).toBe(false);
    expect(pages.every((p) => p.lang === "tr" && p.countryCode === "TR")).toBe(true);
  });

  it("runs titles through the quality gate", () => {
    const pages = buildPageInventory(
      tr,
      data({ titles: [title(), title({ id: 2, tmdbId: 2, loc: { name: "X", overview: null, slug: "x" }, offerCheckedAt: [] })] }),
      now,
    );
    const ok = pages.find((p) => p.path === "/tr/film/vahsi-robot");
    expect(ok).toMatchObject({ type: "title", index: true, reasons: [], hreflangKey: "title:movie:1184918", entityId: 1 });
    expect(ok?.lastModified).toEqual(checked);
    const bad = pages.find((p) => p.path === "/tr/film/x");
    expect(bad?.index).toBe(false);
    expect(bad?.reasons).toEqual(["missing localized overview", "no active offer"]);
  });

  it("skips titles without an edition localization", () => {
    const pages = buildPageInventory(tr, data({ titles: [title({ loc: null })] }), now);
    expect(pages.some((p) => p.type === "title")).toBe(false);
  });

  it("seasons and persons are always noindex", () => {
    const pages = buildPageInventory(
      tr,
      data({ titles: [title({ type: "tv", loc: { name: "Arcane", overview: "…", slug: "arcane" }, seasonNumbers: [1, 2] })], persons: [{ id: 5, tmdbId: 9, slug: "hailee-steinfeld" }] }),
      now,
    );
    expect(pages.find((p) => p.path === "/tr/dizi/arcane")?.index).toBe(true);
    const seasons = pages.filter((p) => p.type === "season");
    expect(seasons.map((p) => p.path)).toEqual(["/tr/dizi/arcane/sezon-1", "/tr/dizi/arcane/sezon-2"]);
    expect(seasons.every((p) => !p.index)).toBe(true);
    expect(pages.find((p) => p.type === "person")).toMatchObject({ path: "/tr/kisi/hailee-steinfeld", index: false });
  });

  it("services, lists and franchises need available content", () => {
    const pages = buildPageInventory(
      tr,
      data({
        services: [
          { id: 1, slug: "netflix", activeOffers: 10, lastCheckedAt: checked },
          { id: 2, slug: "gain", activeOffers: 0, lastCheckedAt: null },
          { id: 3, slug: "not-core", activeOffers: 3, lastCheckedAt: checked },
        ],
        lists: [{ id: 7, slug: "aile", updatedAt: now, items: 3, availableItems: 0 }],
        franchises: [{ id: 3, slug: "toy-story", items: 4, availableItems: 2 }],
      }),
      now,
    );
    expect(pages.find((p) => p.path === "/tr/netflix")?.index).toBe(true);
    expect(pages.find((p) => p.path === "/tr/gain")).toMatchObject({ index: false, reasons: [REASON.noOffers] });
    expect(pages.some((p) => p.path === "/tr/not-core")).toBe(false);
    expect(pages.find((p) => p.type === "list")).toMatchObject({ path: "/tr/turkce-dublaj/aile", index: false });
    expect(pages.find((p) => p.type === "franchise")).toMatchObject({ path: "/tr/seri/toy-story", index: true });
  });

  it("deduplicates paths", () => {
    const pages = buildPageInventory(tr, data({ titles: [title(), title({ id: 9 })] }), now);
    expect(pages.filter((p) => p.path === "/tr/film/vahsi-robot")).toHaveLength(1);
  });
});

describe("summarizeInventory", () => {
  it("counts index/noindex per type and reasons", () => {
    const s = summarizeInventory(buildPageInventory(tr, data({ titles: [title(), title({ id: 2, tmdbId: 2, posterPath: null, loc: { name: "Y", overview: "o", slug: "y" } })] }), now));
    expect(s.byType.title).toEqual({ index: 1, noindex: 1 });
    expect(s.reasons["missing poster"]).toBe(1);
    expect(s.reasons[REASON.utility]).toBe(2);
    expect(s.index + s.noindex).toBe(s.total);
  });
});
