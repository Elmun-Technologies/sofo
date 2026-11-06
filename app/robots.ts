import type { MetadataRoute } from "next";
import { DEMO_DATA, siteUrl } from "@/lib/site";

/** Allow all; keep admin, API, search results and my list out of the index. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  // Sample data must not be indexed as real availability.
  if (DEMO_DATA) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*/ara", "/*/listem"] }],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
