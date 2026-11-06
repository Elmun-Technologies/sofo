export const SITE_NAME = "sofo";

/**
 * Demo mode: the database holds SAMPLE data (prisma/sample-data.ts), not verified availability.
 * Shows a site-wide banner, noindexes every page and empties the sitemap. Turn off after the first
 * real ingest (04) — /api/setup also refuses to load demo data once ingested offers exist.
 */
export const DEMO_DATA = true;

/**
 * Rendered share cards (next/og → resvg PNG) need more CPU than a Worker request allows on Freebuff Sites,
 * so /og and /story serve the title's key art instead. Set true on a host with a higher CPU budget.
 */
export const SHARE_CARD_RENDER = false;

/** Public origin until sofo.tv is connected (Freebuff Sites production). Override with NEXT_PUBLIC_SITE_URL. */
const DEFAULT_SITE_URL = "https://site-ba9127d751304bfab1b5d5927e2fbb88.freebuff.page";

export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
}
