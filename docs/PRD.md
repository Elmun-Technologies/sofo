# PRD — Sofo MVP

Versiya: v2 · Sana: 2026-11-04 · Holat: Draft (founder tasdig'i kutilmoqda) · Task: TASK-016 / TASK-053
Oldingi versiya: v1 (2026-11-02) — "Global Movie Search", 2 sahifa turi.

Dizayn: canvas "YAGONA USLUB" sahifasi (https://claude.ai/artifact/QjjfE8kYPKjasiVwjSFEUS). Ma'lumotlar modeli: `docs/data-model.md`, `prisma/schema.prisma`.

## 1. Muammo

Tomoshabin film yoki serialni **o'z tilida** (dublaj yoki subtitr) qaysi legal servisda ko'rish mumkinligini bilmaydi. Google'da servislarning o'z sahifalari, yangiliklar va pirat saytlar chiqadi. JustWatch servisni ko'rsatadi, lekin audio tilini, sezon/qism darajasidagi tilni va mavjudlik tarixini ko'rsatmaydi.

Talab (Keyword Planner, 2026-11-02): TR — 784 so'z, 276 570 qidiruv/oy; EN (AQSh) — 1 012 so'z, 7,29 mln/oy.

## 2. Pozitsiya

**Sofo — "sof" (halol, legal) tomosha qidiruvi.** Har qanday film yoki serial qayerda, qaysi tilda va qanchaga — 3 soniyada. Video saqlanmaydi, faqat rasmiy servisga yo'naltiriladi.

Wedge: audio/subtitr tili (servis × davlat × sezon × qism). Birinchi bozor — Türkiye (TR edition), keyin US va FR.

## 3. Maqsad va o'lchov

| KPI | 90-kun maqsadi (gate) |
| --- | --- |
| Indekslangan sahifalar | Rejadagi ≈ 510 sahifaning 80%+ |
| Organik tashrif | 50 000/oy |
| Outbound click rate | 10%+ sessiyalardan |
| Ma'lumot yangiligi | `checked_at` ≤ 48 soat (99% offer) |
| Qaytgan foydalanuvchi | 15%+ (30 kun ichida) |
| Alert obunalari | 2 000+ |
| AI Overviews / AI Mode iqtibos | Nishon klasterlarning 10%+ |

## 4. Foydalanuvchilar

1. **TR tomoshabin** — "arcane türkçe dublaj nerede izlenir", "vahşi robot hangi platformda".
2. **Ota-ona** — "türkçe dublajlı çizgi film netflix", yosh bo'yicha.
3. **Anime muxlisi** — sub/dub, yangi qism va dublaj sanasi.
4. **EN tomoshabin (2-bosqich)** — "where to watch …", "… in spanish".

## 5. Qiymatlar (TASK-051) — MVP'ga kiradiganlari

| # | Qiymat | MVP |
| --- | --- | --- |
| V1 | Til ma'lumoti: servis × davlat × sezon × qism bo'yicha audio va subtitr | ✅ |
| V2 | "Qisqa javob" bloki sahifa tepasida (bor/yo'q + servis + til + eng arzon yo'l + `checked_at`) | ✅ |
| V3 | Mavjudlik tarixi (vaqt chizig'i + change log) — log birinchi kundan | ✅ |
| V4 | Franshiza / ko'rish tartibi sahifalari | ✅ (20 ta) |
| V5 | Chiqish kuzatuvchisi (kinoteatr → raqamli → obuna → dublaj) | ✅ (1 hub) |
| V6 | Eng arzon yo'l (obuna / ijara / sotib olish) | ✅ (qisqa javob ichida) |
| V7 | Blogger/yangilik saytlari uchun vidjet | 2-bosqich |
| V8 | Oylik data-PR hisobot | 2-bosqich |
| V9–V10 | AI qidiruv va tavsiya ("Ask sofo") | 2-bosqich |
| V11 | Spoilersiz recap | 3-bosqich |
| V12 | Ishonch: `checked_at`, manba, "Something wrong?" | ✅ |
| V13 | Tezlik: SSR/ISR, reklamasiz, CWV yashil | ✅ |
| V14 | Rasmiy treyler (YouTube embed) | ✅ |

## 6. MVP doirasi — sahifalar (20 tur)

URL'lar TR edition misolida; har edition o'z tilida slug oladi, `hreflang` majburiy.

| # | Sahifa | URL | Indeks | MVP |
| --- | --- | --- | --- | --- |
| 1 | Bosh sahifa | `/tr` | ✅ | ✅ |
| 2 | Qidiruv natijalari | `/tr/ara?q=` | noindex | ✅ |
| 3 | Serial | `/tr/dizi/{slug}` | ✅ | ✅ |
| 4 | Film (qisqa javob + tarix bilan) | `/tr/film/{slug}` | ✅ | ✅ |
| 5 | Sezon / qism | `/tr/dizi/{slug}/sezon-{n}` | MVP'da noindex | ✅ |
| 6 | Katalog (filtrlar) | `/tr/filmler`, `/tr/diziler`, `/tr/anime` | ✅ (faqat kurator kombinatsiyalar) | ✅ |
| 7 | Til hubi | `/tr/turkce-dublaj`, `/tr/turkce-altyazi` | ✅ | ✅ |
| 8 | To'plam (ro'yxat) | `/tr/liste/{slug}` | ✅ | ✅ (50 ta) |
| 9 | Servis | `/tr/{service}` | ✅ | ✅ (8 ta) |
| 10 | Yangi va ketayotganlar | `/tr/yeni-ve-kalkacak` | ✅ | ✅ |
| 11 | Treylerlar hubi | `/tr/fragmanlar` | ✅ | ✅ |
| 12 | Shaxs (foto yo'q) | `/tr/kisi/{slug}` | MVP'da noindex | ✅ |
| 13 | sofo kids | `/tr/kids` | ✅ | ✅ |
| 14 | My list + alertlar | `/my` | noindex | ✅ |
| 15 | Onboarding (modal) | — | — | ✅ |
| 16 | Editionlar + bo'sh natija + 404 | `/editions` | ✅ | ✅ |
| 17 | Qanday ishlaydi / huquqiy | `/tr/hakkinda`, … | ✅ | ✅ |
| 18 | Share kartalar (OG/Story) | `/og/{slug}.png`, `/story/{slug}.png` | — | ✅ (rasm; video — 2-bosqich) |
| 19 | Franshiza / ko'rish tartibi | `/tr/seri/{slug}` | ✅ | ✅ (20 ta) |
| 20 | Chiqish kuzatuvchisi | `/tr/yakinda-dijitalde` | ✅ | ✅ |
| + | AI qidiruv "Ask sofo" | `/tr/sor` | noindex | 2-bosqich |

Hajm: MVP ≈ 510 indekslanadigan URL (TR); 12 oyda ≈ 30 000 (TR + US + FR).

Sub-brendlar (`sofocinema.com`, `sofoserial.com`, `sofotoons.com`, `sofokids.com`, `sofoanime.com`) — alohida sayt emas, 301 redirect → `sofo.tv/{bo'lim}`.

## 7. Funksional talablar

### 7.1 Title sahifa (film / serial)
- Qisqa javob bloki (V2): bitta jumla, eng arzon yo'l, til bo'yicha servislar, "qayerda yo'q", `checked_at`, "Something wrong?".
- Qayerda ko'rish: tablar Stream / Rent / Buy; har offer — servis, taklif turi, narx, audio va subtitr (3 holat: ✓ / — / "tasdiqlanmagan"), deeplink, `outbound_click`.
- Audio va subtitr matritsasi (til × servis).
- Mavjudlik tarixi (V3): yo'laklar vaqt chizig'i + change log.
- Serial: sezon tablari, qism ro'yxati, har qismda til belgisi, qism reytingi ustunlari (TMDB).
- Treylerlar (V14): rasmiy YouTube embed; til filtri (TR / EN / …); "Up next"; autoplay o'chiq.
- Cast & crew — initsiallar (foto yo'q).
- "Agar yoqqan bo'lsa" — 6 ta, shu tilda mavjudlari.
- FAQ (3 savol, ma'lumotdan generatsiya qilingan faktlar; erkin AI matn emas).
- Boshqa davlatlarda (qisqa qator).
- Schema.org: `Movie`/`TVSeries`, `potentialAction: WatchAction`, `offers`, `dateModified`.

### 7.2 Qidiruv
- Header'da doimiy qidiruv (`/` tezkor tugma), < 150 ms natija.
- Original, lokal va muqobil nomlar; TR harflari normalizatsiyasi (vahsi = vahşi); typo → "Did you mean".
- Natija turlari: title, franshiza, shaxs, to'plam. Bo'sh holatda — oxirgi va trend so'rovlar.
- Natija yo'q → "Request this title".

### 7.3 Ro'yxatlar, hublar, servis, yangi/ketayotganlar
- To'plamlar — muharrir yozgan kirish matni (inson tekshiruvi), elementlar ma'lumotdan.
- Servis sahifasi: yangi, Top 10, ketayotganlar, taqqoslash jadvali.
- Yangi va ketayotganlar: haftalik kalendar, servis filtri, "Remind me".

### 7.4 Retention
- **My list** — login'siz (localStorage), login bilan — server.
- **Alertlar**: dublaj chiqdi, yangi qism, servisdan ketyapti, arzonladi. Kanallar: Telegram bot (asosiy), email (haftalik dayjest).
- **Auth**: email magic link, Google, Telegram login. Parol yo'q.
- **Onboarding**: davlat, interfeys tili, audio afzalligi, servislar — 3 qadam, "Skip".

### 7.5 Share
- Har title/sezon/ro'yxat uchun OG rasm (1200×630) va Story rasm (1080×1920), server-side generatsiya.
- Mobil: Web Share API (fayl bilan) → Instagram; havola nusxalanadi, foydalanuvchi link stikerni qo'shadi.

### 7.6 Admin (ichki)
- Ingest holati va xatolar; noaniq nomlarni TMDB ID bilan bog'lash; `noindex` bayroq; "Something wrong?" xabarlari navbati; to'plam muharriri.

### 7.7 Analytics
- GA4: `search`, `view_title`, `outbound_click` (servis, nom, davlat, til, offer turi), `change_country`, `trailer_play`, `share`, `alert_subscribe`, `list_add`.
- Search Console; oylik AI Overviews/AI Mode iqtibos tekshiruvi.

## 8. Ma'lumot manbalari

| Ma'lumot | Manba | Holat |
| --- | --- | --- |
| Availability, narx, audio/subtitr | Streaming Availability API | Kalit kutilmoqda (TASK-006) |
| Metadata, posterlar, treyler kalitlari (YouTube) | TMDB API | Tijoriy litsenziya (TASK-005) |
| Chiqish sanalari | TMDB release dates + servis e'lonlari | MVP'da qo'lda + taxmin ("~") |
| Mavjudlik tarixi | O'z ingest diff'imiz | Birinchi kundan |

## 9. Doiradan tashqari (MVP)

Video hosting yoki qayta montaj; pirat havolalar; aktyor fotosuratlari; IMDb reytingi; sharhlar va reyting qo'yish; mobil ilova; sport; monetizatsiya; AI qidiruv (2-bosqich); vidjet va data-PR (2-bosqich); Story video (2-bosqich).

## 10. Sifat mezoni (indekslash)

Sahifa `index` bo'ladi, agar: metadata to'liq (nom, yil, tavsif, poster) VA kamida 1 ta tasdiqlangan offer (shu edition davlatida) VA `checked_at` ≤ 7 kun. Aks holda `noindex`, sitemap'ga kirmaydi.

## 11. Acceptance criteria

1. Title sahifa LCP < 2,5 s (mobil, 75-persentil), CLS < 0,1, INP < 200 ms.
2. Til holati faqat 3 qiymatdan biri: `confirmed_yes`, `confirmed_no`, `unknown` — UI'da "tasdiqlanmagan" sifatida; hech qachon taxmin emas.
3. Qisqa javob bloki ma'lumotdan deterministik generatsiya qilinadi va offer'lar bilan ziddiyat bo'lmaydi (unit test).
4. Har o'zgarish (`added`, `removed`, `price_change`, `audio_added`, `leaving_announced`) `availability_event` jadvaliga yoziladi (integration test).
5. Har title sahifada to'g'ri `hreflang` va valid structured data (Rich Results test).
6. YouTube embed: autoplay o'chiq, player o'zgartirilmaydi, yuklab olinmaydi.
7. `outbound_click` GA4'da servis va til bilan yoziladi.
8. Pirat domenlar ro'yxatidagi hech bir havola sahifada yo'q (avtomatik test).
9. "Something wrong?" xabari 24 soat ichida qayta tekshiruvga tushadi.
10. Alert: o'zgarishdan keyin ≤ 24 soatda Telegram xabari yuboriladi.

## 12. Bosqichlar

| Bosqich | Muddat | Natija |
| --- | --- | --- |
| 0. Setup | 1-hafta | Repo, DB, ingest skeleti, dizayn tokenlari, domen |
| 1. Ma'lumot | 2–3-hafta | TMDB + Streaming Availability ingest, diff → event, 500 nom TR |
| 2. SEO yadro | 3–5-hafta | Title, sezon, katalog, til hubi, to'plam, servis, sitemap, schema |
| 3. Qiymat | 5–7-hafta | Qisqa javob, tarix, franshiza, chiqish kuzatuvchisi, treylerlar, share rasmlar |
| 4. Retention | 7–8-hafta | My list, auth, alertlar (Telegram), onboarding |
| 5. Ishga tushirish | 9-hafta | 100 → 250 → 500 bosqichli indeksatsiya, monitoring |

## 13. Bog'liqliklar va ochiq savollar

- Streaming Availability API kaliti va TR qamrovi (TASK-006) — **bloklovchi**.
- TMDB tijoriy litsenziyasi (TASK-005).
- Domenlar: sofo.tv, sofocinema.com … — founder ro'yxatdan o'tkazadi.
- Savdo belgisi: TÜRKPATENT / EUIPO rasmiy qidiruv.
- Telegram bot nomi (@sofo… band bo'lishi mumkin).
- KVKK: cookie banner matni, maxfiylik siyosati — yurist.
