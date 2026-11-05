# 01 · Setup (1-hafta)
1. Next.js (App Router, TS strict, Tailwind) loyihasini shu papkada yarat. Papka tuzilishi CLAUDE.md "Folder structure" bo'yicha.
2. tokens.css → globals + Tailwind theme. Manrope va Nunito (next/font).
3. Prisma: schema.prisma ni ishlat. Migratsiya + qo'lda SQL: `pg_trgm`, `unaccent`, IMMUTABLE wrapper funksiya, `title_localization` GIN indeks (data-model.md §6). `ReleaseTrack` unique uchun NULLS NOT DISTINCT (PG15+).
4. Lokal DB: docker-compose.yml (postgres:16). `.env.local` ni .env.example dan yarat.
5. `prisma/seed.ts`: design/assets dagi namuna poster/nomlar bilan ~30 title, 8 servis (Netflix, Prime Video, Disney+, HBO Max, TOD, tabii, Exxen, Gain), TR davlat, offer va OfferLanguage (confirmed_yes/no/unknown aralash).
6. Layout: header/footer, mobil pastki tab bar, edition `[lang]` routing (/tr), hreflang util, `lib/` skeleti.
7. README ga ishga tushirish buyruqlari; CLAUDE.md "Common commands" yangila.
Qabul: `docker compose up`, `pnpm dev`, `pnpm prisma migrate dev`, `pnpm db:seed` ishlaydi; /tr bo'sh layout bilan ochiladi; lint+typecheck yashil.
