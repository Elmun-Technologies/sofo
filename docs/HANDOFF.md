# Sofo — topshirish ro'yxati (founder tomonidan qilinadigan ishlar)

Kod va UI tayyor holatga keltirildi (DS3, `docs/design-system.md`). Quyidagilar **faqat sizning tomoningizdan** bog'lanadi — har biri uchun: nima kerak, qayerga qo'yiladi, nimani ochadi.

## 1. Haqiqiy ma'lumot (eng muhim — hozir hamma narsa namuna/SAMPLE)

| Nima | Qayerga | Natija |
| --- | --- | --- |
| `TMDB_API_KEY` — v4 "API Read Access Token" (tavsiya, `Authorization: Bearer`) yoki v3 kalit + tijoriy litsenziya (TASK-005) | `.env.local` / GitHub Actions secret / Sites secret | Metadata, posterlar, treylerlar (`pnpm ingest:metadata`) |
| `STREAMING_AVAILABILITY_API_KEY` (Movie of the Night; RapidAPI bo'lsa `STREAMING_AVAILABILITY_API_URL` ham) | xuddi shunday | Servis × til × narx (`pnpm ingest:availability`); TR qamrovi/narxi hali tasdiqlanmagan (TASK-006) |
| `data/titles.csv` ro'yxati (`tmdb_id,type`) | repo | Qaysi nomlar ingest bo'ladi |
| Birinchi ingestdan keyin `DEMO_DATA = false` (`lib/site.ts`) | kod, 1 qator | Demo banner o'chadi, `noindex` olinadi, sitemap to'ladi |

## 2. Domen va hosting

- `sofo.tv` (+ sub-domenlar 301 → `sofo.tv/{bo'lim}`, CLAUDE.md ro'yxati) — ro'yxatdan o'tkazish va Freebuff Sites'ga ulash.
- `NEXT_PUBLIC_SITE_URL=https://sofo.tv` (canonical, hreflang, sitemap, OG uchun).
- Sites secretlari: `SETUP_TOKEN`, `ADMIN_USER`, `ADMIN_PASSWORD` (aks holda `/admin` production'da 404), `CRON_SECRET`, `ALERTS_SECRET`.
- Deploy tartibi — CLAUDE.md "Deploy" bo'limi; sxema o'zgarsa `POST /api/setup {"action":"migrate"}`.
- Google Search Console: domenni tasdiqlash, `sitemap.xml` yuborish, indeksatsiya bosqichlari 100 → 250 → 500.

## 3. Analytics va alertlar

- `NEXT_PUBLIC_GA_ID` (GA4) — faqat cookie roziligidan keyin yuklanadi (KVKK).
- Telegram bot: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (BotFather). Email provayderi hali tanlanmagan (hozir dry-run) — tanlab, `lib/alerts/*` ga ulash kerak.
- `.github/workflows/ingest.yml` uchun GitHub secrets: TMDB, Streaming Availability, `CRON_SECRET`.

## 4. Huquqiy va brend (hujjatlarni siz tasdiqlaysiz)

- Pochta qutilari ishlashi kerak: `hello@sofo.tv`, `partners@sofo.tv`, `privacy@sofo.tv` (sahifalarda ko'rsatilgan).
- `/tr/gizlilik` (KVKK/GDPR) va shartlar matnini yurist ko'rib chiqishi kerak.
- Tovar belgisi: TÜRKPATENT / EUIPO rasmiy qidiruvi (9/38/41/42 sinflar).
- Servis logotiplari: hozir faqat 3 ta namuna fayl (`public/sample/lg-*.png`), qolganlari rangli matn belgisi. Rasmiy brend-kit'lar (Netflix, Prime Video, Disney+, HBO Max, TOD, tabii, Exxen, Gain) — ularning press sahifalaridan, foydalanish shartlariga rioya qilib.
- TMDB atributsiyasi (footer'da bor) — litsenziya shartlariga moslash.

## 5. Kontent va tasvirlar

- Muharrir to'plamlari (`/admin/lists`) — hozir namuna. Haqiqiy to'plamlarni yozish (har biri noyob kirish matni, avtomatik AI matn yo'q).
- Brend tasvirlari: edition tanlash sahifasi, About sahifasi uchun stok foto/illyustratsiya kerak bo'lsa — litsenziyali manba (Pexels/Unsplash) va API kaliti sizdan; hozir UI faqat poster/backdrop va tipografiyaga tayanadi, stok rasm shart emas.
- Favicon / PWA ikonkalar to'plami (hozir logo komponenti; `app/icon` fayllari yo'q) va `og` default rasm — brend fayllaringiz bo'lsa qo'shiladi.

## 6. Tekshirib chiqish

- Haqiqiy ma'lumot kirgach: `pnpm seo:sync-pages`, so'ng sifat darvozasi (`lib/quality-gate.ts`) natijalarini ko'rib chiqish.
- Lighthouse / Core Web Vitals — production domenda.
- 90-kun gate: 4 000+ indekslangan sahifa, 50 000+ oylik organik tashrif, 10%+ outbound click.
