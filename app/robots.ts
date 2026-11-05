import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Allow all; keep admin, API, search results and my list out of the index. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*/ara", "/*/listem"] }],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
