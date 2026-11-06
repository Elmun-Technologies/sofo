import type { MetadataRoute } from "next";
import { getAllPageInventory } from "@/lib/seo/pages";
import { DEMO_DATA, siteUrl } from "@/lib/site";

/** Only indexable URLs (quality gate, PRD §10). Rebuilt hourly. */
// Reads D1 at request time (no DB at build — ADR 0002).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (DEMO_DATA) return [];
  const base = siteUrl();
  const pages = await getAllPageInventory();
  return [
    { url: new URL("/", base).toString() },
    ...pages
      .filter((p) => p.index)
      .map((p) => ({ url: new URL(p.path, base).toString(), ...(p.lastModified ? { lastModified: p.lastModified } : {}) })),
  ];
}
