# 04 · Ingest (kalitlar kelgandan keyin)
Kalitlar `.env.local` da bo'lishi shart (chatda emas). `lib/sources/tmdb.ts`, `lib/sources/streaming-availability.ts` — retry, rate-limit, zod validatsiya. `scripts/ingest/*`: metadata → TitleLocalization (tr/en), snapshot → diff → Offer/OfferLanguage + AvailabilityEvent (data-model.md §3). GitHub Actions cron (ADR 0001). 500 TR nomi bilan boshla. Til noma'lum bo'lsa `unknown`.
Ochiq savol: sezon/qism darajasida til beriladimi (TASK-006) — tekshir va CLAUDE.md ga yoz.
Qabul: ingest idempotent (ikki marta yurgizilsa o'zgarish 0); events to'g'ri yoziladi; unit testlar diff mantig'iga.
