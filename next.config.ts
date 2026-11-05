import type { NextConfig } from "next";

const shareAssets = ["./app/og/_fonts/**", "./public/sample/**"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },
  // Dev only: allow opening the dev server via 127.0.0.1 and an optional preview host (comma-separated).
  allowedDevOrigins: ["127.0.0.1", ...(process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? [])],
  // Share-image routes read fonts and sample art from disk.
  outputFileTracingIncludes: {
    "/og/[edition]/[type]/[slug]": shareAssets,
    "/story/[edition]/[type]/[slug]": shareAssets,
  },
  experimental: {
    // Multiple root layouts ((editions), [lang], admin) → one 404 for unmatched URLs.
    globalNotFound: true,
  },
};

export default nextConfig;
