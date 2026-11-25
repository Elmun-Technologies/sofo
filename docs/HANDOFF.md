# Sofo — topshirish ro'yxati (founder tomonidan qilinadigan ishlar)

Kod va UI tayyor holatga keltirildi (DS3, `docs/design-system.md`). Quyidagilar **faqat sizning tomoningizdan** bog'lanadi — har biri uchun: nima kerak, qayerga qo'yiladi, nimani ochadi.

## 0. Production'ga haqiqiy ma'lumot — qadamma-qadam (2026-11-25)

Kod tayyor va lokal sinovdan o'tgan (demo → tozalash → yuklash → takroriy yuklash idempotent). Quyidagilar siz yoki deploy vositasi bor sessiya tomonidan qilinadi:

1. **Tasodifiy tokenlar yarating** (har biri 32+ belgi): `SETUP_TOKEN`, `INGEST_TOKEN`. Masalan: `openssl rand -hex 32`.
2. **Freebuff Sites sirlari:** `SETUP_TOKEN`, `INGEST_TOKEN` (va keyinroq `ADMIN_USER`, `ADMIN_PASSWORD`).
3. **Deploy** (CLAUDE.md → Deploy), so'ng bazani tayyorlash:
   - `POST https://<sayt>/api/setup` `{"action":"migrate"}` — servislar jadvali (0002 migratsiya);
   - `POST https://<sayt>/api/setup` `{"action":"clear-demo"}` — namuna ma'lumotni o'chiradi.
   Ikkalasida header: `Authorization: Bearer <SETUP_TOKEN>`.
4. **GitHub → Settings → Secrets and variables → Actions:** `STREAMING_AVAILABILITY_API_KEY`, `TMDB_API_KEY` (uzun `eyJ…` token), `INGEST_TOKEN` (2-qadamdagi bilan bir xil), `INGEST_URL` (`https://<sayt>`).
5. **Actions → ingest → Run workflow** — birinchi yuklash (~18 so'rov, ~360 nom). Keyin har kuni 06:17 da o'zi ishlaydi.
6. **Sites o'zgaruvchisi `SOFO_DEMO_DATA=0`** va qayta deploy — demo banner va `noindex` o'chadi, sitemap to'ladi.
7. **Google Search Console:** sitemap'ni yuboring (`https://<sayt>/sitemap.xml`).

Limit: Streaming Availability tarifi oyiga 1 000 so'rov; kunlik ishga tushirish ~540/oy sarflaydi.

## 1. Haqiqiy ma'lumot (eng muhim — hozir hamma narsa namuna/SAMPLE)

| Nima | Qayerga | Natija |
| --- | --- | --- |
| `TMDB_API_KEY` — v4 "API Read Access Token" (tavsiya, `Authorization: Bearer`) yoki v3 kalit + tijoriy litsenziya (TASK-005) | `.env.local` / GitHub Actions secret / Sites secret | Metadata, posterlar, treylerlar (`pnpm ingest:metadata`) |
| `STREAMING_AVAILABILITY_API_KEY` (Movie of the Night; RapidAPI bo'lsa `STREAMING_AVAILABILITY_API_URL` ham) | xuddi shunday | Servis × til × narx (`pnpm ingest:availability`); TR qamrovi tekshirildi — `docs/research/2026-11-25-streaming-availability-tr.md` (TOD/tabii/Exxen/Gain yo'q) |
| `data/titles.csv` ro'yxati (`tmdb_id,type`) | repo | Qaysi nomlar ingest bo'ladi |
| Production DB'ga haqiqiy ingest tushgach `SOFO_DEMO_DATA=0` | Sites o'zgaruvchisi | Demo banner o'chadi, `noindex` olinadi, sitemap to'ladi |
| Streaming Availability tarifi: hozir oyiga 1 000 so'rov | movieofthenight.com | Kunlik katalog yangilash ~540/oy; 500+ nom uchun pullik tarif kerak bo'ladi |

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
