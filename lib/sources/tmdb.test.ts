import { describe, expect, it } from "vitest";
import { tmdbAuth } from "./tmdb";

describe("tmdbAuth", () => {
  it("sends a v3 API key as a query parameter", () => {
    expect(tmdbAuth("0123456789abcdef0123456789abcdef")).toEqual({ query: "0123456789abcdef0123456789abcdef" });
  });

  it("sends a v4 read access token (JWT) as a Bearer header, never in the URL", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ4In0.sig";
    expect(tmdbAuth(token)).toEqual({ headers: { Authorization: `Bearer ${token}` } });
  });
});
