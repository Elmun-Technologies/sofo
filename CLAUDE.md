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

Qaror va sabablar: `docs/adr/0001-tech-stack.md`.

- Next.js (App Router, SSG/ISR), TypeScript
- PostgreSQL + Prisma
- Hosting: Vercel (web), Postgres — Supabase yoki Neon (bepul tarif)
- Ingest: Node/TypeScript skriptlar, rejalashtirilgan ishga tushirish (GitHub Actions cron)
- Qidiruv: PostgreSQL `pg_trgm` + `unaccent` (alohida qidiruv dvigatelisiz)
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
- `/{lang}/{service}` — platforma sahifasi (MVP, 8 ta: Netflix, Prime Video, Disney+, HBO Max, TOD, tabii, Exxen, Gain; 2026-11-02 qarori).
- UI: dark kino uslubi (Netflix/Kinopoisk/JustWatch/Letterboxd g'oyalari). Dizayn canvas'i: https://claude.ai/artifact/QjjfE8kYPKjasiVwjSFEUS
- Har bir title sahifasida `hreflang` (tr, en, x-default).
- Slug: lotin, kichik harf, defis; TR harflari transliteratsiya (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u).

## Design (yakunlangan, 2026-11-04)

Canvas: https://claude.ai/artifact/QjjfE8kYPKjasiVwjSFEUS → sahifa "YAGONA USLUB". Eski variantlar "ARXIV ·" sahifalarida.
- 20 sahifa turi: kompyuter (20) + telefon (21 ekran), holatlar, oynalar, KVKK banner.
- Dizayn tizimi v2 (board DS2): Sofo Orange #FF5A1F (hover #FF7A47, pressed #E04A12, tint #FFD5C7, deep #2A150D), fon #0A0A0D, surface #15151B/#1C1C24, line #26262F; semantik: dub #3B82F6, available #4ADE80, leaving #FBBF24, free #A78BFA. Shrift: Manrope (UI), Nunito Black (logo). Bo'shliq 4 px qadam; radius: chip 999, input/button/poster 12, card 16, panel 20, hero 24.
- Kontrast: CTA'da qora matn to'q sariq ustida (6,4:1). Oq matn to'q sariqda faqat ≥ 18 px qalin yoki logo.
- Responsivlik (board Responsive): xs 360–479 (3 poster/qator, chetdan 16), sm 480–767 (4), md 768–1023 (5), lg 1024–1279 (6), xl 1280+ (6–7, max 1360). xs/sm — pastki tab bar (Home, Search, New, My list); filtrlar va modallar — bottom sheet; title sahifada sticky CTA.
- Eslatmalar (board Alerts): Telegram — asosiy, email — haftalik dayjest (juma 18:00), kuniga max 3 Telegram xabar.
- Admin (boards AdminDash, AdminQA, AdminLists): ingest holati va KPI, "Something wrong?" navbati (SLA 24 soat), TMDB bog'lash, to'plam muharriri.

## Key documents

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
DATABASE_URL=
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
1 Bosh · 2 Qidiruv (noindex) · 3 Serial · 4 Film · 5 Sezon/qism (MVP noindex) · 6 Katalog · 7 Til hubi (`/tr/turkce-dublaj`) · 8 To'plam · 9 Servis · 10 Yangi va ketayotganlar · 11 Treylerlar hubi · 12 Shaxs (MVP noindex, foto yo'q) · 13 kids · 14 My list + xabarlar · 15 Onboarding (modal) · 16 Editionlar + bo'sh natija + 404 · 17 About/huquqiy · 18 Share kartalar (og/story rasmlari).
19 Franshiza / ko'rish tartibi (`/tr/seri/{slug}`) · 20 Chiqish kuzatuvchisi (`/tr/yakinda-dijitalde`) · + AI qidiruv "Ask Sofo" (noindex).
URL hajmi: MVP ≈ 510 indekslanadigan (TR), 12 oyda ≈ 30 000 (TR+US+FR). Mobil — alohida sahifa emas, moslashuvchan shablon.

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

## Common commands

```
docker compose up -d        # local Postgres 16
pnpm dev                    # http://localhost:3000/tr
pnpm build
pnpm lint && pnpm typecheck && pnpm test
pnpm prisma migrate dev     # "prisma" script loads .env.local via dotenv-cli
pnpm db:seed                # prisma/seed.ts — sample data, idempotent
pnpm ingest:metadata        # 04-ingest
pnpm ingest:availability    # 04-ingest
```

## Setup decisions (01-setup, 2026-11-05)

- Next.js 16 (App Router) + React 19, Tailwind v4 (tokens → `@theme` in `app/globals.css`; source `design/tokens.css`), TypeScript strict + `noUncheckedIndexedAccess`.
- Prisma pinned to **6.x**: schema keeps `url = env(...)` in datasource (Prisma 7 removes this). Upgrade = separate task.
- Env: only `.env.local` (no `.env`). Prisma CLI reads it through the `prisma` / `db:seed` scripts (`dotenv -e .env.local`).
- Search: `sofo_unaccent(text)` IMMUTABLE wrapper (search_path `public, extensions` for Supabase). GIN trgm indexes on `sofo_unaccent(title_localization.name)` and `sofo_unaccent(title.original_title)`. Queries **must** use `sofo_unaccent(...)` to hit them. `alt_names` not indexed yet.
- `release_track` unique index is `NULLS NOT DISTINCT` (manual edit in init migration; Prisma sees no drift).
- Editions: `lib/editions.ts` (only `tr` live; `dynamicParams=false` → other codes 404). Two root layouts: `app/(editions)` for `/` (edition picker, no IP redirect) and `app/[lang]` (header, footer, mobile tab bar < 768px). `<html lang>` = edition hreflang (`tr`), UI copy English.
- Edition routes (TR): `/tr/ara`, `/tr/katalog` (`?tip=film|dizi`, `?tur=anime` — provisional, revisit in 02 for SEO), `/tr/cocuk`, `/tr/turkce-dublaj`, `/tr/yeni-ve-ayrilanlar`, `/tr/listem`, `/tr/hakkinda`.
- hreflang: `lib/seo/hreflang.ts#buildAlternates` → canonical + languages + `x-default` (EN page, else `/`).
- Images: `lib/images.ts` — `/sample/*` (seed, `public/sample`) or TMDB paths.
- External APIs: `lib/sources/http.ts#fetchJson` (retry/backoff on 429/5xx + per-host min interval).

## UI build (02–08 UI, 2026-11-05)

- Routes (TR): `/tr` home · `/tr/film|dizi/{slug}` (+ `/sezon-{n}`, noindex) · `/tr/filmler|diziler|anime` (filters = URL params; filtered → noindex) · `/tr/cocuk` · `/tr/turkce-dublaj`, `/tr/turkce-altyazi`, `/tr/turkce-dublaj/{list}` · `/tr/{service}` (8) · `/tr/yeni-ve-ayrilanlar` · `/tr/fragmanlar` · `/tr/yakinda-dijitalde` · `/tr/seri/{slug}` · `/tr/kisi/{slug}` (noindex) · `/tr/ara` (noindex) · `/tr/listem` (noindex, localStorage) · `/tr/hakkinda`, `/tr/gizlilik` · `/admin` (Basic auth via `proxy.ts`) · `/sitemap.xml`, `/robots.txt` · `/og|story/{edition}/{movie|tv}/{slug}`.
- Short answer: `lib/short-answer.ts` (unit-tested); offers ranked free < ads < subscription (by ServiceCountry.priceFrom) < rent < buy.
- Quality gate: `lib/quality-gate.ts`; sitemap/inventory `lib/seo/pages.ts` (live) + `pnpm seo:sync-pages` → Page table.
- Search: `lib/search.ts`, `pnpm search:bench` (50 queries, p95 ≈ 15 ms on seed). Extra trgm indexes: person/franchise/list names, `sofo_alt_names()`.
- Alerts: `lib/alerts/*`, `pnpm alerts:dispatch [--dry-run|--digest]` (Telegram only with `TELEGRAM_BOT_TOKEN`; email provider not chosen → dry-run). Telegram handle not stored: bot deep link `t.me/<bot>?start=<signed ref>` sets `telegram_id`.
- KVKK: cookie banner, GA4 loads only after consent. Onboarding modal + "my services" in localStorage (`lib/client/*`).
- `<html lang="tr">` + English UI: every `uppercase` English label needs `lang="en"` (else "i" → "İ").
- `app/global-not-found.tsx` (experimental `globalNotFound`) — several root layouts.
- Seed data is SAMPLE (prisma/seed.ts + seed-extras.ts), incl. YouTube keys — replace via ingest (04).

## Ingest (04, 2026-11-05)

- `lib/sources/tmdb.ts` — TMDB v3 (details + `videos,alternative_titles,external_ids`, `tr-TR`/`en-US`). `lib/sources/streaming-availability.ts` — Streaming Availability API v4 `/shows/{id}?country&output_language&series_granularity=show`. Both go through `lib/sources/http.ts#fetchJson` (retry + per-host rate limit). Responses are validated by hand (`parseShow`, one bad option is dropped, the run continues) — zod was not added, keep the ingest dependency-free until a source changes shape.
- Keys only in `.env.local` / GitHub Actions secrets: `TMDB_API_KEY`, `STREAMING_AVAILABILITY_API_KEY`. `STREAMING_AVAILABILITY_API_URL` switches the base URL (RapidAPI host → `X-RapidAPI-Key`). Without a key the scripts exit with a config message; seed data stays untouched.
- Title list: `data/titles.csv` (`tmdb_id,type`, `#` comments, duplicates ignored). Commands: `pnpm ingest:metadata [-- --limit=50 --dry-run --file=…]` and `pnpm ingest:availability [-- --edition=tr --limit=50 --dry-run --file=…]` (default list = every title in the DB). Cron: `.github/workflows/ingest.yml` — availability daily, metadata dispatch-only.
- Metadata → `Title`, `TitleLocalization` (tr/en, `altNames` from TMDB alternative titles, slug = `slugify(name)` + tmdb id suffix on collision), `Season` (specials skipped), official YouTube `Video` (fan uploads/other sites dropped), `Franchise`/`FranchiseItem` (release order by year, recomputed after each upsert). Credits/persons are not ingested yet. `isKids` = TMDB genre Family/Kids (section placement heuristic, not an availability claim).
- Availability → title-level `Offer` (`seasonId` null) + `OfferLanguage` + `AvailabilityEvent`. Offer key = service × offer type × quality; a quality change is `removed` + `added`. Service map: netflix, prime→prime-video, disney→disney-plus, hbo→hbo-max, tod, tabii, exxen, gain; `addon` options and unmapped services are skipped. Prices only come from `rent`/`buy` options (never plan prices).
- Language rule: languages the API lists become `confirmed_yes`; every other language gets **no row** (= `unknown`), never `confirmed_no`. The API's list is not treated as proof that a dub does not exist.
- Idempotency: the same snapshot twice → 0 creates/updates/deactivations/events; only `checkedAt` is refreshed (that is the page's "checked" proof). `lib/ingest/diff.ts` is pure and unit-tested: `planDiff` → `applyPlanToState` → `planDiff` is empty.
- TASK-006 (season/episode languages): the v4 schema does expose per-season and per-episode `streamingOptions` with their own `audios`/`subtitles` (`series_granularity=season|episode`), so the data exists. We still ingest title-level only (MVP pages read title-level offers); season-level dub rows are a follow-up. TR coverage/price of the API stays unverified without a live key.

## Glossary

- **Availability** — nom × davlat × servis × taklif turi (subscription/free/ads/rent/buy).
- **Wedge** — raqobatchilardan ajratib turuvchi tor ustunlik (bizda: audio tili).
- **Gate** — davom etish/to'xtatish qarorini beruvchi mezon.

## Known pitfalls

- Bir nechta nom noaniq ("got", "legend", "obsession") — entity resolution TMDB ID orqali.
- Keyword Planner minimal qiymati 10 — kichik hajmlar oshirib ko'rsatiladi.
- Google Ads sahifasida brauzer orqali uzun matn yozish xavfli (fokus yo'qolsa tez tugmalar ishlaydi) — CSV yuklash ishlatiladi.

## TODO / Known limitations

- Streaming Availability API'ning TR qamrovi va narxi tasdiqlanmagan (TASK-006).
- TMDB tijoriy litsenziyasi (TASK-005).
- Brend: **Sofo** (founder qarori, 2026-11-03). "Sof" — toza/halol (legal), "sofa" — uyda tomosha. Sub-brendlar: Sofo Cinema, Serial, Toons, Kids, Anime. Domenlar (RDAP bo'sh, 2026-11-03): sofo.tv (asosiy), sofocinema.com, sofoserial.com, sofotoons.com, sofokids.com, sofoanime.com, sofowatch.com, sofodub.com — sub-domenlar 301 redirect → sofo.tv/{bo'lim}. Ro'yxatdan o'tkazish — founder. Logo (tasdiqlangan 2026-11-03): to'q sariq kvadrat ikonka ichida oq "s" + "sofo" yozuvi, shrift Nunito Black 900, ikonka burchagi 27%. Asosiy rang — Sofo Orange #FF5A1F (yalpiz #1FD1A5 o'rniga). Semantik ranglar: dublaj #3B82F6, mavjud #4ADE80, ketayotgan #FBBF24, bepul #A78BFA. Interfeys shrifti — Manrope. TM tekshiruvi: USPTO'da SOFO belgilari boshqa sinflarda (19, 35, 7, 17, 25) — 9/38/41/42 bo'yicha to'qnashuv topilmadi; TÜRKPATENT/EUIPO rasmiy qidiruv kerak.

## Future improvements

- ES (lotin Amerikasi) — 2-bosqich.
- Telegram bot (TASK-044).
- Monetizatsiya variantlari — 5–10K oylik tashrifdan keyin.
