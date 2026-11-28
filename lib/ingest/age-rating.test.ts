import { describe, expect, it } from "vitest";
import { minimumAge, pickAgeRating } from "./age-rating";

describe("age ratings", () => {
  it("reads Turkish RTÜK labels", () => {
    expect(minimumAge("TR", "13+")).toBe(13);
    expect(minimumAge("TR", "7A")).toBe(7);
    expect(minimumAge("TR", "Genel İzleyici Kitlesi")).toBe(0);
    expect(minimumAge("TR", "Yetişkin")).toBeNull();
  });

  it("maps US and GB labels to a minimum age", () => {
    expect(minimumAge("US", "PG-13")).toBe(13);
    expect(minimumAge("US", "TV-MA")).toBe(17);
    expect(minimumAge("GB", "12A")).toBe(12);
    expect(minimumAge("US", "NR")).toBeNull();
  });

  it("prefers the edition country, then falls back", () => {
    expect(pickAgeRating([{ country: "US", rating: "R" }, { country: "TR", rating: "18+" }], "TR")).toBe("18+");
    expect(pickAgeRating([{ country: "US", rating: "PG-13" }, { country: "TR", rating: "" }], "TR")).toBe("13+");
    expect(pickAgeRating([{ country: "FR", rating: "U" }], "TR")).toBeNull();
  });
});
