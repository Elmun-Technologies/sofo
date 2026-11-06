# ADR 0002 — Freebuff Sites (Cloudflare Workers) + D1

Sana: 2026-11-06 · Holat: Qabul qilindi (production publish) · ADR 0001 ning hosting/DB qismini almashtiradi

## Kontekst

- Founder saytni Freebuff Sites'ga chiqarishni so'radi. Sites — Cloudflare Workers (OpenNext) + D1 (SQLite) + R2.
- Birinchi publish yiqildi: Next build vaqtida sahifalar PostgreSQL'ga murojaat qildi, Sites'da esa Postgres yo'q.
- Tashqi Postgres (Neon/Supabase) — yangi akkaunt va maxfiy kalit talab qiladi; hozircha yo'q.

## Qaror

| Qatlam | Avval (0001) | Endi |
|---|---|---|
| Hosting | Vercel | Freebuff Sites (Workers, OpenNext 1.20, `sites_prepare_next`) |
| DB | PostgreSQL + Prisma | **D1 (SQLite) + Prisma 6 `@prisma/adapter-d1`** |
| Qidiruv | `pg_trgm` + `unaccent` | TypeScript'da trigram reyting (`lib/search.ts`), izolyat ichida 5 daq. indeks |
| Migratsiyalar | `prisma migrate` | `migrations/*.sql` (`prisma migrate diff`), lokal: `wrangler d1 migrations apply`, remote: `/api/setup` |
| Sahifalar | SSG/ISR build vaqtida | Build vaqtida DB yo'q: `[lang]` — `generateStaticParams() → []` (birinchi so'rovda render + ISR R2 keshi); `searchParams` o'qiydigan sahifalar `force-dynamic` |

Tafsilotlar:
- SQLite'da ro'yxat maydoni yo'q → `genres`, `alt_names`, `ui_langs`, `kinds` — JSON matn. `lib/db.ts` o'qishda `string[]` ga qaytaradi (`$extends.result`), yozishda `toList()`, filtr — `listHas()`.
- D1'da interaktiv tranzaksiya yo'q → ingest ketma-ket, idempotent yozadi; batch `$transaction([...])` atomar emas.
- Prisma client har so'rov uchun alohida (`getCloudflareContext().ctx` kaliti) — Workers I/O so'rovlar orasida bo'linmaydi.
- `/api/setup` (Bearer `SETUP_TOKEN` secret): migratsiyalar + demo ma'lumot (`lib/generated/d1-bundle.ts`, `scripts/d1/build-bundle.py`). Ingest qilingan ma'lumot bo'lsa demo yuklashni rad etadi.
- `lib/site.ts`: `DEMO_DATA = true` — banner, noindex, bo'sh sitemap. Birinchi haqiqiy ingest'dan keyin `false`.
- `next/og` fallback shrifti `.bin` data-modulga aylanardi (Sites qabul qilmaydi) → `patches/next@16.4.5.patch`. resvg PNG render Worker CPU limitiga sig'maydi → `SHARE_CARD_RENDER = false`: `/og`, `/story` title key art'ini beradi.

## Oqibatlar

- (+) Bitta platforma, tashqi akkauntsiz ishlaydi; ISR + R2 kesh.
- (−) `pg_trgm` darajasidagi qidiruv emas (seed'da 50/50, p95 ≈ 67 ms lokal); ~20 000+ nomda qayta ko'rish.
- (−) Ingest GitHub Actions'dan D1'ga yozolmaydi (Cloudflare kalitlari yo'q) — hozircha lokal D1 uchun; production uchun himoyalangan ingest endpoint yoki Workers cron kerak (keyingi task).
- (−) Rendered share kartalar (OG/Story) — yuqori CPU hosting yoki oldindan generatsiya kerak.

## Qayta ko'rish shartlari

- Katalog 20 000+ nom yoki qidiruv sekin → Postgres (Neon) + Hyperdrive yoki alohida qidiruv.
- D1 limitlari (so'rov/hajm) yetmasa.
