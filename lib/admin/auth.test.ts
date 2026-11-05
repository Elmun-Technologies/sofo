import { describe, expect, it } from "vitest";
import { adminAuthMode, checkBasicAuth, isAdminRequest, safeEqual } from "./auth";

const basic = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;

describe("admin auth", () => {
  it("mode depends on env", () => {
    expect(adminAuthMode({ ADMIN_USER: "a", ADMIN_PASSWORD: "b", NODE_ENV: "production" })).toBe("basic");
    expect(adminAuthMode({ NODE_ENV: "production" })).toBe("disabled");
    expect(adminAuthMode({ ADMIN_USER: "a", NODE_ENV: "development" })).toBe("dev");
  });
  it("safeEqual", async () => {
    expect(await safeEqual("secret", "secret")).toBe(true);
    expect(await safeEqual("secret", "secreT")).toBe(false);
    expect(await safeEqual("", "x")).toBe(false);
  });
  it("checks Basic credentials (password may contain ':')", async () => {
    expect(await checkBasicAuth(basic("admin", "p:w"), "admin", "p:w")).toBe(true);
    expect(await checkBasicAuth(basic("admin", "nope"), "admin", "p:w")).toBe(false);
    expect(await checkBasicAuth("Bearer x", "admin", "p:w")).toBe(false);
    expect(await checkBasicAuth("Basic !!!", "admin", "p:w")).toBe(false);
    expect(await checkBasicAuth(null, "admin", "p:w")).toBe(false);
  });
  it("isAdminRequest", async () => {
    const env = { ADMIN_USER: "u", ADMIN_PASSWORD: "p", NODE_ENV: "production" };
    expect(await isAdminRequest(basic("u", "p"), env)).toBe(true);
    expect(await isAdminRequest(undefined, env)).toBe(false);
    expect(await isAdminRequest(undefined, { NODE_ENV: "production" })).toBe(false);
    expect(await isAdminRequest(undefined, { NODE_ENV: "development" })).toBe(true);
  });
});
