# ADR 0003 — Self-host (Coolify, Docker) + SQLite fayl

Sana: 2026-11-25 · Holat: Qabul qilindi (founder: "productionda ishga tushiramiz", o'z Coolify serveri) · ADR 0002 ni almashtirmaydi — ikkinchi runtime qo'shadi

## Kontekst

- Founderning o'z serveri bor (Coolify v4, Docker). Freebuff Sites deploy vositasi bizda yo'q, production URL sandbox'dan ochilmaydi.
- Coolify'da Cloudflare D1 yo'q. Kod esa D1 binding'ga bog'langan edi (`getCloudflareContext().env.DB`).

## Qaror

Bitta kod — ikki runtime, `SOFO_SQLITE_PATH` tanlaydi:

| | Workers (ADR 0002) | Self-host (bu ADR) |
|---|---|---|
| Ishga tushirish | OpenNext → Freebuff Sites | `Dockerfile` → `next start` (Node 22) |
| DB | D1 binding `DB` | SQLite fayl `/data/sofo.db` (volume), `@prisma/adapter-better-sqlite3` |
| Migratsiya | `POST /api/setup {"action":"migrate"}` | Konteyner har start'da `scripts/selfhost/migrate.ts` (idempotent; `d1_migrations` jadvali — xuddi shu) |
| Sirlar | Worker env | `process.env` (`lib/runtime.ts#runtimeEnv`) |

- Sxema, migratsiyalar, ingest diff, `/api/ingest`, `/api/setup` — o'zgarmagan; `lib/d1-setup.ts` endi D1'ning kichik bo'lagi (`SqlDb`) bilan ishlaydi, `lib/sqlite-file.ts` uni better-sqlite3 ustida beradi.
- Native modullar (`better-sqlite3`) faqat `nodeRequire()` orqali yuklanadi — bundler ko'rmaydi, Workers build'ga kirmaydi.
- Sana formati ikkala adapterda bir xil (ISO matn) — bazani D1 ↔ fayl o'rtasida ko'chirish mumkin.
- Demo rejim (`SOFO_DEMO_DATA` ≠ 0): bo'sh bazaga start'da namuna ma'lumot yuklanadi. Production: `SOFO_DEMO_DATA=0`, baza ingest push bilan to'ladi.

## Tekshirildi (sandbox, 2026-11-25)

`docker build` → konteyner (`/data` volume) → migratsiya 0001+0002 → `pnpm ingest:push --from-cache` = 314 nom / 421 taklif → restart'dan keyin ma'lumot saqlangan, healthcheck `healthy`; `/tr`, title, servis, qidiruv, sitemap — 200.

## Oqibatlar

- Zaxira nusxa — founder serverida: `/data/sofo.db` volume'ini Coolify backup yoki `sqlite3 .backup` bilan saqlash.
- Bitta konteyner = bitta yozuvchi; SQLite WAL rejimida. Gorizontal masshtab kerak bo'lsa — Postgres/Turso'ga ko'chish alohida ADR.
- Freebuff/Workers yo'li saqlanadi, lekin endi asosiy production — Coolify.
