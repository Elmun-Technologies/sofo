import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },
  // Prisma ships workerd-specific builds; OpenNext patches them when they stay external.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Dev only: allow opening the dev server via 127.0.0.1 and an optional preview host (comma-separated).
  allowedDevOrigins: ["127.0.0.1", ...(process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? [])],
  experimental: {
    // Multiple root layouts ((editions), [lang], admin) → one 404 for unmatched URLs.
    globalNotFound: true,
  },
};

if (process.env.NODE_ENV === "development") {
  // `next dev` gets the local D1 binding (env.DB) from Wrangler — same database as `pnpm db:seed`.
  initOpenNextCloudflareForDev({ configPath: "./freebuff.wrangler.jsonc" });
}

export default nextConfig;
