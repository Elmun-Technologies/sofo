You are deploying the web app "Sofo" on my Coolify server, which is open in this browser tab (http://2.29.137.243:8000, team "Root Team"). Talk to me in Uzbek. Do not delete, stop or edit any existing project (Comfort, Forest, Govita, Gulf, launch-cv, original-agents, Promotors, Tinglovchi…) — only create the new one below.

## 1. Project and resource
1. Projects → "+" → create project **Sofo** (environment: production).
2. In it: "+ New" → **Public Repository**.
   - Repository URL: `https://github.com/Elmun-Technologies/sofo`
   - Branch: `claude/hopeful-ramanujan-l6hvnb` (later we switch to `main`)
   - Server: localhost · Build Pack: **Dockerfile** (not Nixpacks) · Port: **3000**
   - Continue / Save.

## 2. Configuration (before the first deploy)
1. **Name**: `sofo-web`.
2. **Domains**: keep the domain Coolify generated (`http://….sslip.io`); if the field is empty, click "Generate Domain". Write the full domain down — it is `<DOMAIN>` below. If I give you my own domain, use `https://<my domain>` instead.
3. **Ports Exposes**: `3000`.
4. **Persistent Storage** → "+ Add" → Volume Mount → name `sofo-data`, destination path **`/data`**. This holds the database file; it must exist before deploying.
5. **Environment Variables** → add these (use "Normal view", one per row):
   | Key | Value | Build time? |
   |---|---|---|
   | `SOFO_DEMO_DATA` | `0` | yes (and runtime) |
   | `NEXT_PUBLIC_SITE_URL` | `<DOMAIN>` exactly, no trailing slash | **yes** (it is baked in at build) |
   | `INGEST_TOKEN` | random token A | runtime only |
   | `SETUP_TOKEN` | random token B | runtime only |
   | `ADMIN_USER` | `admin` | runtime only |
   | `ADMIN_PASSWORD` | random token C | runtime only |

   Make the random tokens yourself in the browser, never invent them: open a new blank tab, and in the console run
   `[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,"0")).join("")`
   once per token (3 times). Don't paste tokens anywhere except Coolify (and GitHub in step 4).
6. Save everything.

## 3. Deploy and check
1. Click **Deploy**. The build takes ~3–6 minutes (pnpm install + next build). Watch the deployment log.
2. Success looks like: `[selfhost] /data/sofo.db: applied 0001_init.sql, 0002_base_services.sql`, then `✓ Ready`. Status becomes Running (healthy).
3. Open `<DOMAIN>/tr` — the Sofo home page (dark UI) must load. It is still empty of titles; that's expected.
4. Open `<DOMAIN>/robots.txt` and `<DOMAIN>/admin` (login with ADMIN_USER / ADMIN_PASSWORD) — both should work.
5. If the build fails: copy the last ~40 lines of the log and show them to me. Don't change the Dockerfile or the repository.

## 4. GitHub secrets for the daily data import
Open https://github.com/Elmun-Technologies/sofo/settings/secrets/actions (I'm logged in). Add repository secrets:
- `INGEST_TOKEN` = the same token A
- `INGEST_URL` = `<DOMAIN>`
Then tell me to add the two API keys myself (`TMDB_API_KEY` — the long "API Read Access Token" from themoviedb.org/settings/api, and `STREAMING_AVAILABILITY_API_KEY` from movieofthenight.com). Do not open or copy those keys yourself.
After I confirm they are added: Actions → **ingest** → Run workflow (branch `claude/hopeful-ramanujan-l6hvnb`). When it finishes green, reload `<DOMAIN>/tr` — ~300 real titles with posters should appear.

## 5. Report back
Tell me in Uzbek: the domain, deploy status, what you checked, and the ADMIN_PASSWORD (so I can save it in my password manager). Do not put any token in a GitHub issue, commit or chat other than this one.
