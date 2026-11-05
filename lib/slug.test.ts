import { describe, expect, it } from "vitest";
import { slugify, transliterate } from "./slug";

describe("transliterate", () => {
  it("maps Turkish letters", () => {
    expect(transliterate("çğıöşü ÇĞİÖŞÜ")).toBe("cgiosu cgiosu");
  });
  it("strips other diacritics", () => {
    expect(transliterate("Amélie Pokémon")).toBe("Amelie Pokemon");
  });
});

describe("slugify", () => {
  it("builds lowercase hyphenated slugs", () => {
    expect(slugify("Vahşi Robot")).toBe("vahsi-robot");
    expect(slugify("Ters Yüz 2")).toBe("ters-yuz-2");
    expect(slugify("Örümcek-Adam: Örümcek Evrenine Geçiş")).toBe("orumcek-adam-orumcek-evrenine-gecis");
    expect(slugify("Rick and Morty")).toBe("rick-and-morty");
    expect(slugify("  Kung Fu Panda 4!  ")).toBe("kung-fu-panda-4");
    expect(slugify("Ghibli's Spirited Away")).toBe("ghiblis-spirited-away");
  });
});
