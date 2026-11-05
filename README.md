# Sofo — Claude Code handoff paketi

Legal "qayerda ko'rish" qidiruvi (audio/subtitr tili bo'yicha). Birinchi bozor: Türkiye (/tr). Video saqlamaymiz, faqat rasmiy servislarga yo'naltiramiz.

## Boshlash (3 qadam)
1. Bo'sh papka oching, zip'ni shu yerga yoying: `unzip sofo-handoff.zip && cd sofo-handoff && git init`
2. `claude` ni shu papkada ishga tushiring.
3. `prompts/00-bootstrap.md` ichidagi matnni Claude Code'ga bering. Keyin faqat bitta prompt — bitta bosqich (01 → 08).

## Ishga tushirish (lokal)

Talab: Node 20+, pnpm 9, Docker.

```bash
pnpm install                 # deps + prisma generate
cp .env.example .env.local   # DATABASE_URL docker-compose bilan mos
docker compose up -d         # Postgres 16
pnpm prisma migrate dev      # sxema + pg_trgm/unaccent + qidiruv indekslari
pnpm db:seed                 # namuna: 30 title, 8 servis, TR
pnpm dev                     # http://localhost:3000/tr
```

Tekshiruvlar: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Tarkib
| Yo'l | Nima |
|---|---|
| `CLAUDE.md` | Loyiha bilimi (Claude Code avtomatik o'qiydi). Yagona manba |
| `docs/PRD.md` | Mahsulot talablari, 20 sahifa turi, acceptance criteria, 9 haftalik reja |
| `docs/data-model.md` | Ma'lumotlar modeli, ingest diff→event, "qisqa javob", sifat darvozasi |
| `docs/adr/0001-tech-stack.md` | Texnologiya qarori |
| `docs/DESIGN-INDEX.md` | Har sahifa turi → URL → dizayn rasmi |
| `prisma/schema.prisma` | 26 model (validate ✓) |
| `design/screens/*.jpg` | Barcha dizayn ekranlari (kompyuter + telefon) |
| `design/tokens.css`, `tokens.json` | Rang, shrift, radius, breakpoint tokenlari |
| `design/source/` | Canvas HTML boardlari va generatorlar (faqat ma'lumot uchun) |
| `design/assets/` | Namuna poster/backdrop/logolar (namuna ma'lumot uchun) |
| `prompts/` | Bosqichma-bosqich promptlar |
| `.env.example` | Muhit o'zgaruvchilari (qiymatsiz) |

## Qoidalar (qisqa)
- Sirlar (API kalit, parol) hech qachon chatga/repo'ga yozilmaydi — faqat `.env.local` va Vercel env.
- Til ma'lumoti hech qachon taxmin qilinmaydi (`confirmed_yes/no/unknown`).
- Treyler — faqat YouTube embed. Pirat havola yo'q. Shaxs fotosi yo'q.
- Dizayndagi ma'lumotlar — namuna. Haqiqiy ma'lumot TMDB + Streaming Availability'dan.
- CLAUDE.md har muhim qarordan keyin yangilanadi.

## Founder qiladigan ishlar (Claude Code qila olmaydi)
- [ ] sofo.tv (+ sofocinema/serial/toons .com) ro'yxatdan o'tkazish
- [ ] TMDB API kaliti → `.env.local` (TASK-005)
- [ ] Streaming Availability API kaliti → `.env.local` (TASK-006)
- [ ] GitHub repo, Vercel, Supabase/Neon akkauntlari
- [ ] TÜRKPATENT/EUIPO rasmiy brend qidiruvi
- [ ] KVKK matnlari (yurist)
