# Data model — Sofo MVP

Sana: 2026-11-04 · Sxema: `prisma/schema.prisma` (26 model, `prisma validate` ✓) · Bog'liq: `docs/PRD.md`

## 1. Guruhlar

| Guruh | Modellar | Vazifa |
| --- | --- | --- |
| Katalog | `Title`, `TitleLocalization`, `Season`, `Episode`, `Person`, `Credit`, `Franchise`, `FranchiseItem` | TMDB'dan metadata; lokal nom va slug har til uchun |
| Mavjudlik | `Country`, `Service`, `ServiceCountry`, `Offer`, `OfferLanguage` | Hozirgi holat: qayerda, qanday taklif, qaysi tilda |
| Tarix | `AvailabilityEvent` | V3 — ingest diff yozadi, qo'lda tahrir yo'q |
| Chiqish | `ReleaseTrack` | V5 — kinoteatr → raqamli → obuna → dublaj; `isEstimate` = "~" |
| Video | `Video` | Faqat rasmiy YouTube kalitlari (film/sezon/qism, til, vertikal) |
| Muharrir / SEO | `List`, `ListItem`, `Page` | To'plamlar; har URL uchun indeks holati va hreflang kaliti |
| Foydalanuvchi | `User`, `UserService`, `WatchlistItem`, `Alert` | My list, servislar, alertlar (Telegram/email) |
| Sifat | `ErrorReport`, `SearchStat` | "Something wrong?" navbati; trend va natijasiz so'rovlar |

## 2. Asosiy qoidalar

1. **Til hech qachon taxmin qilinmaydi.** `OfferLanguage.status` = `confirmed_yes` | `confirmed_no` | `unknown`. UI'da `unknown` → "Not confirmed by the service".
2. **Offer granularligi**: title (+ ixtiyoriy sezon/qism) × davlat × servis × taklif turi × sifat. Sezon darajasidagi til farqi `seasonId` bilan yoziladi.
3. **Tarix faqat diff'dan**: ingest har ishga tushganda yangi snapshot'ni joriy `Offer`'lar bilan solishtiradi va farqni `AvailabilityEvent`'ga yozadi.
4. **Video** — faqat `site=youtube`, `isOfficial=true`. Fayl saqlanmaydi.
5. **Shaxs** — foto maydoni yo'q (atayin).
6. **Foydalanuvchi ma'lumoti minimal**: email yoki Telegram ID; `SearchStat` — agregat, shaxsiy ma'lumotsiz (KVKK).

## 3. Ingest diff → event

```
for each (title, country, service, offerType, quality) in snapshot ∪ current:
  new only      → Offer insert (firstSeenAt=now)          + event added
  current only  → Offer.isActive=false                    + event removed
  price differs → Offer.price update                      + event price_change {before, after}
  audio/sub set differs per lang → OfferLanguage upsert   + event audio_added / audio_removed / subtitle_*
  leavingAt appears             → Offer.leavingAt         + event leaving_announced
  always        → Offer.checkedAt = snapshot time
```

Alert dispatcher yangi event'larni `Alert.kinds` bilan moslab, ≤ 24 soatda Telegram/email yuboradi (`lastSentAt` — takror yubormaslik).

## 4. "Qisqa javob" (V2) — deterministik

Kirish: title, edition davlati, foydalanuvchi audio afzalligi (default — edition tili dublaji).

1. Faol offer'lar → `subscription` / `free` / `ads` bo'yicha guruhlash.
2. Afzal til `confirmed_yes` bo'lgan eng arzon variant → "Ha — {service}'da, {til} bilan".
3. Faqat subtitr bo'lsa → "Ha, lekin faqat {til} subtitr bilan".
4. Faqat `rent/buy` → "Obunada yo'q; ijara {narx}dan".
5. Hech narsa → "Hozir {davlat}'da legal yo'q" + boshqa davlatlar + Notify.
6. "Qayerda yo'q": edition'ning asosiy servislaridan offer'i yo'qlari + oxirgi `removed` event sanasi.

Matn shablon + ma'lumotdan; LLM ishlatilmaydi.

## 5. Sifat darvozasi (indeks)

`Page.indexStatus = index`, agar:
- `TitleLocalization` (edition tili) da `name`, `overview` bor, `Title.posterPath` bor;
- edition davlatida kamida 1 ta faol `Offer`, `checkedAt` ≤ 7 kun.

Aks holda `noindex` va sitemap'dan chiqariladi. Sezon va shaxs sahifalari MVP'da doim `noindex`.

## 6. Indekslar va qidiruv

- Qidiruv: `TitleLocalization.name` + `altNames` + `Title.originalTitle` ustida `pg_trgm` GIN indeks, `unaccent` bilan (TR harflari). Migratsiyada qo'lda:
  `CREATE INDEX title_loc_name_trgm ON title_localization USING gin (unaccent(name) gin_trgm_ops);`
  (eslatma: `unaccent` IMMUTABLE emas — wrapper funksiya kerak.)
- Tez-tez so'rovlar: `offer(title_id, country_code, is_active)`, `offer(country_code, service_id, is_active)`, `offer_language(lang, kind, status)`, `availability_event(title_id, country_code, occurred_at)`.

## 7. Ochiq savollar

- Streaming Availability API sezon/qism darajasida til berishini tasdiqlash (TASK-006) — bermasa, `seasonId` NULL bo'ladi.
- `ReleaseTrack` unique'da `lang` NULL bo'lishi mumkin — Postgres NULL'larni teng hisoblamaydi; dublikat oldini olish uchun ilova darajasida tekshiruv yoki `NULLS NOT DISTINCT` (PG 15+).
