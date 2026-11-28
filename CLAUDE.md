# Sofo (Global Movie Search) — CLAUDE.md

Loyihaning yagona bilim manbai. Muhim qaror o'zgarsa — shu fayl va Notion "Qarorlar jurnali" birga yangilanadi.

## Overview

Legal "qayerda ko'rish" gidi: film yoki serialni qaysi legal servisda, qaysi davlatda va **qaysi audio/subtitr tilida** ko'rish mumkinligini ko'rsatadi. Film fayllarini saqlamaymiz, pirat manbalarga havola bermaymiz.

- Pozitsiya: TR-first "Türkçe dublaj rehberi", EN — ikkinchi navbatda (long-tail).
- Lokal SEO (founder qarori, 2026-11-03): davlat/til bo'yicha edition (/tr, /fr, /us...). Har editionda o'sha davlat katalogi, mahalliy nomlar va mahalliy til atamalari (TR: "türkçe dublaj/altyazı"; FR: VF, VOSTFR; US: "Spanish audio"). IP bo'yicha avto-redirect yo'q — faqat taklif banneri; hreflang majburiy.
- Dizayn modeli: IVI tuzilmasi (karusel, kayfiyat qatorlari, belgilar, katalog filtrlari), lekin qidiruv birinchi o'rinda va brend bizniki. To'liq ko'rish — faqat platformaning o'zida.
- UI tili (founder qarori, 2026-11-02): default — ingliz tili, sayt ko'p tilli (til tanlagich: EN, TR, ES, DE, FR, PT, RU, AR, UZ...). Kontent sahifalari tillar bo'yicha bosqichma-bosqich (avtomatik tarjima matni yo'q).
- Wedge: audio/dublaj tili bo'yicha qidiruv — JustWatch va boshqalar bu ma'lumotni bermaydi.
- Kanal: SEO (Google). Asosiy KPI: indekslangan sifatli sahifalar va organik tashrif.
- Task boshqaruvi: Notion "Global Movie Search — HQ" → Master Tasks (TASK-xxx).

## Goals (MVP, 90 kun)

- 500 sahifa (TR 411 + EN 89), bosqichma-bosqich indeksatsiya: 100 → 250 → 500.
- 90-kun gate: 4 000+ indekslangan sahifa yoki rejaga mos, 50 000+ oylik organik tashrif, 10%+ outbound click.

## Business rules

1. Faqat legal servislarga havola. Pirat sayt, torrent, "izle" ko'zgu saytlariga havola — **taqiqlangan**.
2. Har bir availability yozuvida `checked_at` bo'ladi va sahifada ko'rsatiladi.
3. Audio/subtitr ma'lumoti faqat manbada tasdiqlangan bo'lsa ko'rsatiladi; noma'lum bo'lsa "ma'lumot yo'q", taxmin qilinmaydi.
4. Sahifa faqat sifat mezonidan o'tsa indekslanadi (kamida 1 ta tasdiqlangan availability + metadata to'liq); aks holda `noindex`.
5. Monetizatsiya MVP'da yo'q (founder qarori, 2026-11-02). Outbound click tracking esa birinchi kundan bor.
6. Sport kontenti — MVP doirasidan tashqarida.

## Tech stack

Qaror va sabablar: `docs/adr/0001-tech-stack.md`, `docs/adr/0002-cloudflare-d1.md` (2026-11-06), **`docs/adr/0003-self-host-coolify.md` (2026-11-25, production)**.

- Next.js (App Router, ISR), TypeScript
- **Cloudflare D1 (SQLite) + Prisma 6 (`@prisma/adapter-d1`)** — ADR 0002
- Hosting: **Coolify (founder serveri, Docker)** — `Dockerfile`, SQLite fayl `/data/sofo.db` (ADR 0003). Zaxira yo'l: Freebuff Sites (Workers + D1) — `deploy/freebuff-site.json`
- DB tanlovi: `SOFO_SQLITE_PATH` bor → better-sqlite3 adapter (self-host); yo'q → D1 binding (`lib/runtime.ts`)
- Ingest: Node/TypeScript skriptlar; production'ga `pnpm ingest:push` → `POST /api/ingest` (Bearer `INGEST_TOKEN`), GitHub Actions har kuni (`.github/workflows/ingest.yml`)
- Qidiruv: TypeScript trigram reyting (`lib/search.ts`), alohida dvigatelsiz
- Analytics: GA4 + Google Search Console

## Data sources (TASK-004 qarori)

| Ma'lumot | Manba | Holat |
| --- | --- | --- |
| Availability + audio/subtitr | Streaming Availability API (Movie of the Night) | API kaliti kutilmoqda |
| Metadata, posterlar | TMDB API | Tijoriy foydalanish uchun shartnoma kerak (TASK-005) |
| Zaxira availability | Watchmode | Ixtiyoriy |
| **Ishlatilmaydi** | TMDB watch providers, JustWatch API | JustWatch'ga qaramlik va majburiy atributsiya |

## Folder structure

```
/app                 Next.js routes: (editions)/ → "/", [lang]/ → editions
/components          shared UI (header, footer, tab bar, logo)
/lib                 domain logikasi, db client, editions, seo, sources
/prisma              schema.prisma (26 model, validate ✓), migrations
/scripts/ingest      metadata va availability ingest
/scripts/seo         sitemap, indeksatsiya rejasi
/docs                PRD.md (v2), data-model.md, adr/
/data                seed va indeksatsiya ro'yxatlari (CSV)
```

## URL conventions

- `/{lang}/{type}/{slug}` — title sahifa. `type`: `film` | `dizi` (tr), `movie` | `tv` (en).
- `/tr/turkce-dublaj/{liste-slug}` — ro'yxat sahifalari.
- `/{lang}/{service}` — platforma sahifasi. MVP (2026-11-25, TASK-006 natijasi): Netflix, Prime Video, Disney+, HBO Max, Crunchyroll — ma'lumot manbasi borlar. TOD, tabii, Exxen, Gain — manba topilguncha olib turildi (`lib/editions.ts` coreServices).
- UI: dark kino uslubi (Netflix/Kinopoisk/JustWatch/Letterboxd g'oyalari). Dizayn canvas'i: https://claude.ai/artifact/QjjfE8kYPKjasiVwjSFEUS
- Har bir title sahifasida `hreflang` (tr, en, x-default).
- Slug: lotin, kichik harf, defis; TR harflari transliteratsiya (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u).

## Design (DS4 "Sofo Market", 2026-11-25 — DS3 o'rniga)

Founder qarori (2026-11-25): DS3 "Netflix shabloni"dek ko'rindi. Yangi yo'nalish — **santehnika-online.ru tuzilishi** (katta katalog-do'kon: "kino = mahsulot") + **ivi.ru aksentlari** (til belgilari, kino-qora bloklar). To'liq qoidalar: **`docs/design-system.md`** (DS4).
- Yorug' tema: oq sahifa, `surface #F3F5F9`, grafit matn. Qora "kino orollari" faqat title hero va bosh sahifadagi Top 10 (`theme-dark` utility tokenlarni blok ichida almashtiradi).
- Header: utility qator → logo + to'q sariq **Catalogue** mega-menyu (`components/catalog-menu.tsx`, `lib/queries/mega-menu.ts`) + to'ldirilgan qidiruv (to'q sariq tugma) + ikonkalar → kategoriya qatori. Qidiruv takliflarida "Category / Platform" qatorlari.
- Katalog: breadcrumbs, H1 + son, rasmli janr plitkalari, chap filtr paneli (`filter-sidebar.tsx`, checkbox-linklar sonlar bilan), inline saralash. Mobil — filter sheet.
- Title sahifa: qora hero (poster, faktlar, qisqa javob, "Where to watch" bloki) + sticky tablar (`title-tabs.tsx`).
- Poster belgilari: to'ldirilgan pill — türkçe dublaj ko'k, altyazı kulrang, New yashil, Leaving to'q sariq, Free binafsha.
- Sofo Orange `#FF5A1F` = harakat (Catalogue, qidiruv, hero CTA, "Watch on …"), to'q sariq ustida qora matn. Primary neutral = grafit tugma.
- Shrift: Manrope 700/800 sarlavhalar (qalin, ixcham), Nunito Black — faqat logo. Radius: tugma/input 12, card 16, panel/hero 20.

## Key documents

- `docs/design-system.md` — DS4 dizayn tizimi (tokenlar, theme-dark, komponentlar); DS3 arxivi pastda.
- `docs/HANDOFF.md` — founder tomonidan ulanadigan narsalar ro'yxati.
- `docs/PRD.md` — PRD v2 (Sofo, 20 sahifa turi, qiymatlar, bosqichlar, acceptance criteria).
- `docs/data-model.md` — ma'lumotlar modeli, ingest diff → event, qisqa javob algoritmi, sifat darvozasi.
- `prisma/schema.prisma` — sxema (PostgreSQL + pg_trgm + unaccent).
- `docs/adr/0001-tech-stack.md` — Next.js + Postgres + Prisma + Vercel.

## Naming & coding standards

- TypeScript strict. Fayl nomlari kebab-case, React komponentlar PascalCase.
- DB: jadval va ustunlar snake_case; Prisma model nomlari PascalCase.
- Server Components default; client component faqat interaktivlik kerak bo'lsa.
- Har bir tashqi API chaqiruv `lib/sources/*` ichida, retry va rate-limit bilan.

## Environment variables (qiymatlarsiz)

```
SETUP_TOKEN=            # Sites secret — /api/setup (D1 has no URL)
INGEST_TOKEN=           # Sites secret — /api/ingest; same value in GitHub Actions (+ INGEST_URL)
SOFO_DEMO_DATA=         # Sites var — 0 once real data is loaded
SOFO_SQLITE_PATH=       # self-host only (Docker default /data/sofo.db); unset = Cloudflare D1
STREAMING_AVAILABILITY_API_KEY=
TMDB_API_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GA_ID=
```

Sirlar faqat `.env.local` / Vercel env'da. Repo'ga commit qilinmaydi.

## SEO rules

- Scaled content abuse'dan himoya: har sahifada noyob ma'lumot (servislar, audio/subtitr, narx turi, checked_at), avtomatik tarjima matnlari yo'q.
- Schema.org: `Movie` / `TVSeries` + `potentialAction: WatchAction`.
- Sitemap faqat indekslanadigan sahifalar bilan.

## Page inventory (2026-11-03, TASK-050)

18 sahifa turi (canvas "YAGONA USLUB" sahifasi, 0-board = sayt xaritasi):
1 Bosh · 2 Qidiruv (noindex) · 3 Serial · 4 Film · 5 Sezon/qism (MVP noindex) · 6 Katalog · 7 Til hubi (`/tr/turkce-dublaj`) · 8 To'plam · 9 Servis · 10 Yangi va ketayotganlar · 11 Treylerlar hubi · 12 Shaxs (MVP noindex, TMDB foto bor) · 13 kids · 14 My list + xabarlar · 15 Onboarding (modal) · 16 Editionlar + bo'sh natija + 404 · 17 About/huquqiy · 18 Share kartalar (og/story rasmlari).
19 Franshiza / ko'rish tartibi (`/tr/seri/{slug}`) · 20 Chiqish kuzatuvchisi (`/tr/yakinda-dijitalde`) · + AI qidiruv "Ask Sofo" (noindex).
URL hajmi: MVP ≈ 510 indekslanadigan (TR), 12 oyda ≈ 30 000 (TR+US+FR). Mobil — alohida sahifa emas, moslashuvchan shablon.

## No counts in the UI (founder qarori, 2026-11-28)

Katalog hajmini ko'rsatuvchi sonlar saytda **yo'q** (sarlavha yonidagi son, platforma kartochkalari, filtr/menyu sonlari, tab belgilari, "N titles" meta-tavsiflar, hub/ro'yxat statistikasi). Sabab: kichik raqamlar platforma obro'sini tushiradi. Yangi komponentda katalog/ro'yxat soni chiqarmang. Istisnolar: bitta nomning faktlari (fasl/qism, yil, davomiylik, reyting, "Part n of N") va foydalanuvchining o'z "My list" hisoblagichlari.

## Value features (TASK-051, 2026-11-03)

- Film/serial sahifasi tepasida "short answer": bitta jumla (bor/yo'q, servis, til) + eng arzon yo'l + `checked_at` + "Something wrong?" havolasi.
- Mavjudlik tarixi: har o'zgarish `availability_events` jadvaliga yoziladi (birinchi kundan) — sahifada vaqt chizig'i va change log.
- Til ma'lumoti tasdiqlanmasa — "Not confirmed by the service", hech qachon taxmin yo'q.
- Chiqish sanasi taxmini "~" belgisi bilan va manba izohi bilan.
- AI faqat: ma'lumot quvuri, sayt ichidagi qidiruv/tavsiya, muharrir qoralamasi. Sahifalarga avtomatik AI matn — yo'q.

## Trailer & share policy (2026-11-03)

- Rasmiy treyler: faqat YouTube iframe embed. Video kalitlari — TMDB `/movie/{id}/videos`, `/tv/{id}/season/{n}/videos`, `/tv/{id}/season/{n}/episode/{e}/videos` (`site=YouTube`, `official=true`, `iso_639_1` = treyler tili).
- Taqiqlangan (YouTube Developer Policies III.E.1, III.I.06–07): yuklab olish, keshlash, qayta montaj, audio/videoni ajratish, player ustiga yopish. Autoplay o'chiq (data sharing).
- Film kadrlaridan o'z treylerimizni montaj qilmaymiz (mualliflik huquqi, takedown xavfi).
- "Bizning treyler" = kadrsiz motion-karta (key art + til + platforma + havola), 9:16 (1080×1920, ≤20 s) va 16:9 (1920×1080). Server-side render (masalan Remotion), CDN kesh.
- Instagram Stories: web'dan to'g'ridan-to'g'ri API yo'q → mobil Web Share API (files) orqali share sheet; havola stikerni foydalanuvchi qo'shadi (biz havolani nusxalaymiz). Native ilova bo'lsa — `instagram-stories://` + Facebook App ID.
- Safe zone: yuqori ~250 px, past ~250 px (1080×1920) — logo va matn shu zonadan tashqarida.

## Testing strategy

- Unit: slug, transliteratsiya, availability normalizatsiyasi.
- Integration: ingest → DB (mock API javoblari bilan).
- E2E (Playwright): title sahifa render, hreflang, schema, outbound link.
- Smoke (2026-11-25, brauzersiz, istalgan deploy'ga qarshi): `pnpm smoke -- --base=<url>` (`scripts/e2e/smoke.ts`) — asosiy sahifalar 200, 404, robots → sitemap, title sahifada bitta H1, canonical, hreflang, JSON-LD Movie/TVSeries + WatchAction, outbound havola `noopener nofollow`, checked sana, pirat havola yo'q, sitemap URL'lari 200 va indexable. Har deploy'dan keyin Coolify terminalida yoki lokal ishga tushiriladi.

## Common commands

```
pnpm db:migrate             # local D1 (.wrangler/state) ← migrations/*.sql
pnpm db:seed                # sample data into local D1, idempotent
pnpm dev                    # http://localhost:3000/tr (next dev + local D1 via initOpenNextCloudflareForDev)
pnpm build
pnpm lint && pnpm typecheck && pnpm test
python3 scripts/d1/build-bundle.py   # after schema/seed changes: regenerate lib/generated/d1-bundle.ts
pnpm ingest:metadata        # 04-ingest
pnpm ingest:availability    # 04-ingest
pnpm smoke -- --base=http://localhost:3000   # HTTP smoke test (also against production)
```

## Setup decisions (01-setup, 2026-11-05)

- Next.js 16 (App Router) + React 19, Tailwind v4 (tokens → `@theme` in `app/globals.css`; source `design/tokens.css`), TypeScript strict + `noUncheckedIndexedAccess`.
- Prisma pinned to **6.x** (D1 adapter, `driverAdapters`). Upgrade = separate task.
- Env: only `.env.local` (no `.env`); D1 needs no URL.
- ~~Postgres search/`NULLS NOT DISTINCT`~~ — superseded by ADR 0002 (D1). `release_track` unique with NULL `lang` is not enforced by SQLite → check in app code.
- Editions: `lib/editions.ts` (only `tr` live; `dynamicParams=false` → other codes 404). Two root layouts: `app/(editions)` for `/` (edition picker, no IP redirect) and `app/[lang]` (header, footer, mobile tab bar < 768px). `<html lang>` = edition hreflang (`tr`), UI copy English.
- Edition routes (TR): `/tr/ara`, `/tr/katalog` (`?tip=film|dizi`, `?tur=anime` — provisional, revisit in 02 for SEO), `/tr/cocuk`, `/tr/turkce-dublaj`, `/tr/yeni-ve-ayrilanlar`, `/tr/listem`, `/tr/hakkinda`.
- hreflang: `lib/seo/hreflang.ts#buildAlternates` → canonical + languages + `x-default` (EN page, else `/`).
- Images: `lib/images.ts` — `/sample/*` (seed, `public/sample`) or TMDB paths.
- External APIs: `lib/sources/http.ts#fetchJson` (retry/backoff on 429/5xx + per-host min interval).

## UI build (02–08 UI, 2026-11-05)

- Routes (TR): `/tr` home · `/tr/film|dizi/{slug}` (+ `/sezon-{n}`, noindex) · `/tr/filmler|diziler|anime` (filters = URL params; filtered → noindex) · `/tr/cocuk` · `/tr/turkce-dublaj`, `/tr/turkce-altyazi`, `/tr/turkce-dublaj/{list}` · `/tr/{service}` (8) · `/tr/yeni-ve-ayrilanlar` · `/tr/fragmanlar` · `/tr/yakinda-dijitalde` · `/tr/seri/{slug}` · `/tr/kisi/{slug}` (noindex) · `/tr/ara` (noindex) · `/tr/listem` (noindex, localStorage) · `/tr/hakkinda`, `/tr/gizlilik` · `/admin` (Basic auth via `proxy.ts`) · `/sitemap.xml`, `/robots.txt` · `/og|story/{edition}/{movie|tv}/{slug}`.
- Short answer: `lib/short-answer.ts` (unit-tested); offers ranked free < ads < subscription (by ServiceCountry.priceFrom) < rent < buy.
- Quality gate: `lib/quality-gate.ts`; sitemap/inventory `lib/seo/pages.ts` (live) + `pnpm seo:sync-pages` → Page table.
- Search: `lib/search.ts`, `pnpm search:bench` (50 queries; D1/TypeScript trigram: 50/50, p95 ≈ 67 ms local).
- Alerts: `lib/alerts/*`, `pnpm alerts:dispatch [--dry-run|--digest]` (Telegram only with `TELEGRAM_BOT_TOKEN`; email provider not chosen → dry-run). Telegram handle not stored: bot deep link `t.me/<bot>?start=<signed ref>` sets `telegram_id`.
- KVKK: cookie banner, GA4 loads only after consent. Onboarding modal + "my services" in localStorage (`lib/client/*`).
- `<html lang="tr">` + English UI: every `uppercase` English label needs `lang="en"` (else "i" → "İ").
- `app/global-not-found.tsx` (experimental `globalNotFound`) — several root layouts.
- Seed data is SAMPLE (prisma/seed.ts + seed-extras.ts), incl. YouTube keys — replace via ingest (04).

## Ingest (04, 2026-11-05)

- `lib/sources/tmdb.ts` — TMDB v3 (details + `videos,alternative_titles,external_ids`, `tr-TR`/`en-US`). `lib/sources/streaming-availability.ts` — Streaming Availability API v4 `/shows/{id}?country&output_language&series_granularity=show`. Both go through `lib/sources/http.ts#fetchJson` (retry + per-host rate limit). Responses are validated by hand (`parseShow`, one bad option is dropped, the run continues) — zod was not added, keep the ingest dependency-free until a source changes shape.
- Keys only in `.env.local` / GitHub Actions secrets: `TMDB_API_KEY` (v3 key → `?api_key=`, or v4 read token `eyJ…` → `Authorization: Bearer`, preferred: keeps the secret out of URLs), `STREAMING_AVAILABILITY_API_KEY`. `STREAMING_AVAILABILITY_API_URL` switches the base URL (RapidAPI host → `X-RapidAPI-Key`). Without a key the scripts exit with a config message; seed data stays untouched.
- **Quota (2026-11-25): Streaming Availability plan = 1 000 requests / month** (header `X-Quota-Used`). `/shows/{id}` costs 1 request per title → use the catalogue crawl: `pnpm ingest:catalog -- --pages=15 --kids-pages=3` (`/shows/search/filters`, 20 titles + full TR options per request) writes `data/titles.csv` and caches raw pages in `.cache/sa/<edition>-<ts>/`; then `pnpm ingest:metadata` (TMDB) and `pnpm ingest:availability -- --from-cache=<dir>` (0 requests). Use `--file=` per-title mode only for the few titles the crawl misses.
- Sandbox/proxy runs: keys are proxy-injected network secrets, so pass placeholders and Node's env proxy: `NODE_USE_ENV_PROXY=1 TMDB_API_KEY=eyJproxy-injected STREAMING_AVAILABILITY_API_KEY=proxy-injected pnpm ingest:…`. A `--dry-run` still calls the API (spends quota).
- `patches/@prisma__adapter-d1@6.19.3.patch`: relation loads chunk at 80 bind values (D1 caps at 100; Prisma adds relation filters on top of the adapter's 98 → "too many SQL variables" once the DB has a few hundred titles).
- Demo mode is an env switch: `SOFO_DEMO_DATA=0` turns off the banner/noindex/empty sitemap (default on). Local dev with real data: `SOFO_DEMO_DATA=0` in `.env.local`; `SOFO_IMAGES_UNOPTIMIZED=1` only in the sandbox (Next's image optimizer ignores HTTPS_PROXY).
- Base reference data (country TR + the 5 services, no plan prices) comes from `migrations/0002_base_services.sql`, not the demo seed.
- **Coverage & cost (2026-11-28):** `selfhost:refresh` = head crawl 12 pages + kids 3 + **rotation 8** (`--rotate=8`, `lib/ingest/rotation.ts`: one slice per UTC day — top-rated movies/series, TR originals via `show_original_language`, all-time popular movies/series, trending this month, family & comedy; 7-day cycle, a failed slice is skipped) ≈ 23 SA requests/day. Metadata runs with `--refresh-days=7` (new titles + ~1/7 of the rest daily) and `--episode-seasons=3` (TMDB `/tv/{id}/season/{n}` for the newest 3 aired seasons; generic "N. Bölüm" names → English name). Availability `--stale=5 --stale-days=9` (rotation re-checks every title weekly). Age rating: TMDB `release_dates` / `content_ratings` → `title.age_rating` "13+" (`lib/ingest/age-rating.ts`, TR → US → GB → DE; unknown labels dropped, never guessed). After deploying this change run `pnpm ingest:metadata` once without `--refresh-days` to backfill age ratings and episodes.
- **Production write path (2026-11-25):** the Worker holds no API keys. A runner crawls (`pnpm ingest:catalog`), then `pnpm ingest:push -- --target=<site>` (needs `INGEST_TOKEN` + `TMDB_API_KEY`): asks `/api/ingest` which titles exist (`kind: known`), fetches TMDB metadata only for new ones, posts `metadata` (≤10/request) then `availability` (≤25/request). The endpoint (`app/api/ingest/route.ts`, payload parser `lib/ingest/payload.ts`, unit-tested) runs the same `apply.ts` diff, so a re-push is idempotent (0 events). Verified locally: demo → `clear-demo` → push = 314 titles / 421 offers, second push 421 unchanged.
- First production import: deploy → `/api/setup {"action":"migrate"}` → `{"action":"clear-demo"}` (deletes sample rows, restores base services; refuses once real offers exist) → push → set `SOFO_DEMO_DATA=0`.
- Title list: `data/titles.csv` (`tmdb_id,type`, `#` comments, duplicates ignored). Commands: `pnpm ingest:metadata [-- --limit=50 --dry-run --file=…]` and `pnpm ingest:availability [-- --edition=tr --limit=50 --dry-run --file=…]` (default list = every title in the DB). Cron: `.github/workflows/ingest.yml` — daily catalogue crawl + push (needs repo secrets `STREAMING_AVAILABILITY_API_KEY`, `TMDB_API_KEY`, `INGEST_TOKEN`, `INGEST_URL`; skips with a notice otherwise).
- Metadata → `Title`, `TitleLocalization` (tr/en, `altNames` from TMDB alternative titles, slug = `slugify(name)` + tmdb id suffix on collision), `Season` (specials skipped), official YouTube `Video` (fan uploads/other sites dropped), `Franchise`/`FranchiseItem` (release order by year, recomputed after each upsert). Credits (2026-11-25): directors (movie) / creators (tv) + top 10 billed cast from the English TMDB `credits` → `Person` (by tmdb id, slug + id on collision; `photo_path` = TMDB `profile_path`, never wiped by a later payload without one) and `Credit` (replaced per title, `creditsOf` unit-tested); feeds Cast & crew, person pages and person search. `isKids` = TMDB genre Family/Kids (section placement heuristic, not an availability claim).
- Availability → title-level `Offer` (`seasonId` null) + `OfferLanguage` + `AvailabilityEvent`. Offer key = service × offer type × quality; a quality change is `removed` + `added`. Service map: netflix, prime→prime-video, disney→disney-plus, hbo→hbo-max, crunchyroll (tod, tabii, exxen, gain kept for later); `addon` options and unmapped services are skipped. Prices only come from `rent`/`buy` options (never plan prices).
- Event dating (2026-11-25): an `added` event takes the option's `availableSince` from the API (never in the future). On a title's **first** import in a country (baseline: it never had an offer there), an undated offer gets **no** `added` event — we cannot claim when it arrived, and a first import must not flood "New this week" with the back catalogue. Later undated additions are dated at write time.
- Language rule: languages the API lists become `confirmed_yes`; every other language gets **no row** (= `unknown`), never `confirmed_no`. The API's list is not treated as proof that a dub does not exist.
- Idempotency: the same snapshot twice → 0 creates/updates/deactivations/events; only `checkedAt` is refreshed (that is the page's "checked" proof). `lib/ingest/diff.ts` is pure and unit-tested: `planDiff` → `applyPlanToState` → `planDiff` is empty.
- TASK-006 (season languages, done 2026-11-25): the catalogue crawl and per-title checks use `series_granularity=season` (same request cost). `parseShow` keeps `seasons[]` (number from "Season N", else index), `normalizeShow` → `SnapshotTitle.seasons`, `apply.ts#ingestSeasonOffers` diffs offers per `Season` row (`seasonId` set, **no events**; a season missing from the snapshot is deactivated). Every title-level query filters `seasonId: null`; season cards show `türkçe dublaj` per season once any season has offers. Episode granularity not ingested.

## Deploy (Coolify, ADR 0003 — production)

- Coolify → resource from Git (public repo), build pack **Dockerfile**, port 3000, persistent storage → `/data`.
- Env: `SOFO_DEMO_DATA=0` (build + runtime), `NEXT_PUBLIC_SITE_URL` (build time — canonical/hreflang/sitemap), `INGEST_TOKEN`, `SETUP_TOKEN`, `ADMIN_USER`, `ADMIN_PASSWORD`. `SOFO_SQLITE_PATH=/data/sofo.db` is the image default.
- Start: `scripts/selfhost/migrate.ts` (idempotent migrations; demo data only in demo mode on an empty DB) → `next start`. Healthcheck `/robots.txt`.
- Fill the DB (primary, 2026-11-25 — GitHub Actions is disabled on the founder's account): Coolify env `TMDB_API_KEY` + `STREAMING_AVAILABILITY_API_KEY` (runtime), then in the container `pnpm selfhost:refresh` = catalogue crawl (12 popular + 3 animation + 8 rotation pages = 23 SA requests; see Ingest → Coverage & cost) → TMDB metadata → availability from the cache → **stale sweep** (`--stale=5`: re-checks the 5 oldest titles not checked for 9+ days via `/shows/{id}`, so titles that fell out of the popular pages still get deactivated when they leave; `lib/ingest/stale.ts`) → `POST /api/revalidate` (drops the ISR cache; pages otherwise keep an empty render for up to 1 h). Daily: Coolify Scheduled Task `pnpm selfhost:refresh` at `17 3 * * *` (≈ 28 requests/day ≈ 840/month of the 1 000 quota).
- Alternative: GitHub Actions `ingest` (secrets incl. `INGEST_URL`) or `pnpm ingest:push -- --target=<domain>` from any machine; `/api/ingest` revalidates pages itself after writes.
- Scripts inside the container (Coolify terminal) use the same file: `SOFO_SQLITE_PATH` is set, so `pnpm ingest:*`, `pnpm seo:sync-pages` work there.
- Sandbox `docker build` needs proxy + CA (test-only variant); the committed Dockerfile is for a normal network.

## Deploy (Freebuff Sites, ADR 0002 — fallback)

- Site `deploy/freebuff-site.json` (production: https://site-ba9127d751304bfab1b5d5927e2fbb88.freebuff.page). D1 binding `DB` (production), secret `SETUP_TOKEN`.
- Flow: `sites_prepare_next` → `wrangler dev --config freebuff.wrangler.jsonc` (workerd) test → `sites_deploy` (manifest `freebuff-sites-build/manifest.json`) → `POST /api/setup {"action":"migrate"}` (or `"demo"` while `DEMO_DATA`) with `Authorization: Bearer $SETUP_TOKEN`.
- Schema change: edit `prisma/schema.prisma` → new `migrations/000N_*.sql` (`prisma migrate diff --from-schema-datamodel … --script`) → `pnpm db:migrate` → rebuild bundle → deploy → `/api/setup migrate`.
- No DB at build time: `[lang]` layout `generateStaticParams() → []`; pages reading `searchParams` must be `force-dynamic` (else `DYNAMIC_SERVER_USAGE` 500).
- Workers limits: no fs (use ASSETS — `readPublic` in `app/og/_lib/share.tsx`), no interactive transactions, CPU budget too small for resvg PNG (`SHARE_CARD_RENDER = false`). `patches/next@16.4.5.patch` drops next/og's bundled fallback font (Sites rejects data modules) — always pass `fonts`.
- `/admin` is 404 in production until `ADMIN_USER` / `ADMIN_PASSWORD` secrets are set. `/api/ingest` is 404 until `INGEST_TOKEN` is set.

## Glossary

- **Availability** — nom × davlat × servis × taklif turi (subscription/free/ads/rent/buy).
- **Wedge** — raqobatchilardan ajratib turuvchi tor ustunlik (bizda: audio tili).
- **Gate** — davom etish/to'xtatish qarorini beruvchi mezon.

## Known pitfalls

- Bir nechta nom noaniq ("got", "legend", "obsession") — entity resolution TMDB ID orqali.
- Keyword Planner minimal qiymati 10 — kichik hajmlar oshirib ko'rsatiladi.
- Google Ads sahifasida brauzer orqali uzun matn yozish xavfli (fokus yo'qolsa tez tugmalar ishlaydi) — CSV yuklash ishlatiladi.

## TODO / Known limitations

- TASK-006 tekshirildi (2026-11-25, `docs/research/2026-11-25-streaming-availability-tr.md`): API TR'da Netflix, Prime Video, Disney+, HBO Max (+ Mubi, Crunchyroll, Curiosity, Zee5) — **TOD, tabii, Exxen, Gain yo'q**. 30 nomdan 30 tasi mavjud, 26 tasida türkçe dublaj, 28 tasida altyazı tasdiqlangan; Crunchyroll anime'da til ro'yxati bo'sh (= unknown). Qaror (2026-11-25, founder tavsiyani qabul qildi): 4 mahalliy servis MVP ro'yxatidan olib turildi, Crunchyroll qo'shildi; keyin Watchmode tekshiriladi. API limiti: oyiga 1 000 so'rov. Lokal D1'da birinchi haqiqiy ingest: 343 nom, 472 taklif, sitemap'da 394 indekslanadigan URL.
- TMDB tijoriy litsenziyasi (TASK-005).
- Brend: **Sofo** (founder qarori, 2026-11-03). "Sof" — toza/halol (legal), "sofa" — uyda tomosha. Sub-brendlar: Sofo Cinema, Serial, Toons, Kids, Anime. Domenlar (RDAP bo'sh, 2026-11-03): sofo.tv (asosiy), sofocinema.com, sofoserial.com, sofotoons.com, sofokids.com, sofoanime.com, sofowatch.com, sofodub.com — sub-domenlar 301 redirect → sofo.tv/{bo'lim}. Ro'yxatdan o'tkazish — founder. Logo (tasdiqlangan 2026-11-03): to'q sariq kvadrat ikonka ichida oq "s" + "sofo" yozuvi, shrift Nunito Black 900, ikonka burchagi 27%. Asosiy rang — Sofo Orange #FF5A1F (yalpiz #1FD1A5 o'rniga). Semantik ranglar: dublaj #3B82F6, mavjud #4ADE80, ketayotgan #FBBF24, bepul #A78BFA. Interfeys shrifti — Manrope. TM tekshiruvi: USPTO'da SOFO belgilari boshqa sinflarda (19, 35, 7, 17, 25) — 9/38/41/42 bo'yicha to'qnashuv topilmadi; TÜRKPATENT/EUIPO rasmiy qidiruv kerak.

## Future improvements

- ES (lotin Amerikasi) — 2-bosqich.
- Telegram bot (TASK-044).
- Monetizatsiya variantlari — 5–10K oylik tashrifdan keyin.
