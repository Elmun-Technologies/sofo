# ADR 0001 — Tech stack (MVP)

Sana: 2026-11-02 · Holat: Taklif (founder tasdig'i kutilmoqda) · Task: TASK-019

## Kontekst

- Mahsulot: SEO-ga tayangan, asosan statik sahifalar (500 → 5 000), kuniga bir marta yangilanadigan availability ma'lumoti.
- Jamoa: founder + Claude (kod), inson review. Byudjet minimal, bepul tariflar afzal.
- Founder tajribasi: Next.js, NestJS, PostgreSQL, Prisma, Docker, Vercel, Railway.

## Qaror

| Qatlam | Tanlov | Sabab |
| --- | --- | --- |
| Web | Next.js (App Router), TypeScript | SSG/ISR — tez sahifa, yaxshi Core Web Vitals, SEO uchun standart; founder biladi |
| Backend | Alohida backend yo'q (Next.js route handlers + skriptlar) | MVP'da API iste'molchisi faqat sayt; NestJS qo'shimcha xizmat va deploy xarajati |
| DB | PostgreSQL | Relyatsion model (title × country × service × audio), `pg_trgm` qidiruv |
| ORM | Prisma | Founder biladi, migratsiyalar oson |
| DB hosting | Supabase yoki Neon (bepul tarif) | 500–5 000 sahifa uchun yetarli |
| Web hosting | Vercel (bepul/Hobby tarif — tijoriy foydalanish shartlarini tekshirish kerak) | Next.js uchun eng oddiy; ISR |
| Ingest | TypeScript skriptlar + GitHub Actions cron | Bepul, alohida server kerak emas |
| Qidiruv | PostgreSQL `pg_trgm` + `unaccent` | Alohida Meilisearch/Elastic kerak emas, 5 000 nomgacha yetadi |
| Analytics | GA4 + Search Console | Bepul, SEO KPI'lar uchun yetarli |

## Rad etilgan variantlar

- **NestJS + alohida API**: MVP'da ortiqcha murakkablik. Ommaviy B2B API kerak bo'lganda qayta ko'riladi.
- **Meilisearch / Algolia**: 5 000 nomgacha Postgres yetadi; qo'shimcha xizmat va narx.
- **Redis**: ISR keshlash yetarli; ingest uchun navbat kerak emas.

## Oqibatlar

- (+) Bitta deploy, minimal xarajat, tez ishga tushirish.
- (−) Vercel Hobby tarifining tijoriy cheklovlari — monetizatsiya boshlanganda Pro yoki boshqa hostingga o'tish kerak bo'ladi.
- (−) Ingest GitHub Actions'da — og'ir ishlar uchun keyinroq Railway/worker kerak bo'lishi mumkin.

## Qayta ko'rish shartlari

- Katalog 20 000+ nomdan oshsa yoki qidiruv sekinlashsa → alohida qidiruv dvigateli.
- B2B API yoki mobil ilova kerak bo'lsa → alohida backend.
