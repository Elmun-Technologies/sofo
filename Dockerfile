# Sofo — self-hosted image (ADR 0003): Next.js on Node + SQLite file on a volume (/data).
# Coolify: build pack "Dockerfile", port 3000, persistent storage → /data.

# Build: the full image already has python3/make/g++ (better-sqlite3 source fallback) and OpenSSL (Prisma).
FROM node:22-bookworm AS build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* are inlined at build time: mark them "available at build time" in Coolify.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_ID
ARG SOFO_DEMO_DATA=0
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    SOFO_DEMO_DATA=$SOFO_DEMO_DATA
RUN pnpm build

# Run: slim image + OpenSSL (Prisma's query engine links libssl) and CA certificates.
FROM node:22-bookworm-slim AS run
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    SOFO_SQLITE_PATH=/data/sofo.db
COPY --from=build /app /app
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Migrate (idempotent) on every start, then serve.
CMD ["sh", "-c", "pnpm exec tsx scripts/selfhost/migrate.ts && exec pnpm exec next start -H 0.0.0.0 -p ${PORT}"]
