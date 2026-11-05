import type { MetadataRoute } from "next";
import { getAllPageInventory } from "@/lib/seo/pages";
import { siteUrl } from "@/lib/site";

/** Only indexable URLs (quality gate, PRD §10). Rebuilt hourly. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = await getAllPageInventory();
  return [
    { url: new URL("/", base).toString() },
    ...pages
      .filter((p) => p.index)
      .map((p) => ({ url: new URL(p.path, base).toString(), ...(p.lastModified ? { lastModified: p.lastModified } : {}) })),
  ];
}
