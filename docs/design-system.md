# Sofo design system — DS3 "cinema" (2026-11-24)

Founder brief (2026-11-24): the DS2 build read as "cartoonish and simple". Direction: the calm, dense,
cinema-grade look of IVI / Kinopoisk — imagery first, restrained colour, quiet type, facts on demand.
Brand stays (Sofo Orange, Manrope, Nunito Black logo). Tokens live in `app/globals.css` (`@theme`).

## Principles

1. **Imagery carries the page, chrome stays quiet.** Dark violet-tinted neutrals, alpha hairlines, no decorative gradients or glow blobs. One accent.
2. **Orange is for the action.** Primary CTA, active nav underline, focus ring, the logo. Never for headings, body text or decoration.
3. **Semantic colour = meaning.** dub `#3B82F6` (blue dot / pill), available `#4ADE80`, leaving `#FBBF24`, free `#A78BFA`. Prefer a 6 px dot + text or a soft `Pill` over solid blocks; solid `DubBadge` only on posters.
4. **Calm type.** Headings 700, UI labels 600, body 500. No all-caps except `overline`. Sentence case everywhere.
5. **Facts on demand.** Resting cards are quiet; hover (pointer devices) reveals score, year, genres, languages.
6. **Never guess.** Unknown language = "not confirmed" in `leaving` tone. Every availability shows `checked_at`.

## Tokens

- Neutrals: `ink #0C0B11` (page), `ink-2 #100F16` (footer, inputs), `surface #17161F`, `surface-2 #1F1D2A`, `surface-3 #2B2938`; borders `hairline` (white 8%) and `hairline-strong` (white 14%). Text `text` / `text-2 #AEACBC` / `text-3 #787589`.
- Radii: poster 8 · button/input/chip 10 · card 12 · panel/hero 16. Circles only for avatars, dots, round icon buttons.
- Weights are remapped: `font-bold` = 600, `font-extrabold` = 700 (800 is the logo only). `font-semibold` = 600, `font-medium` = 500.
- Shadows: `shadow-card`, `shadow-pop` (menus, dialogs, floating panels), `shadow-poster`, `shadow-cta` (primary button only).
- Motion: `ease-out` 150–300 ms. `animate-fade-up`, `animate-pop-in`, `animate-sheet-up`. Reduced motion is honoured globally.

## Utilities (`app/globals.css`)

| Utility | Use |
| --- | --- |
| `wrap` | Page container (max 1360, gutters 16 / 28). Replaces `mx-auto max-w-site px-4 md:px-7`. |
| `section-y` | Vertical rhythm between page sections. |
| `text-display` `text-h1` `text-h2` `text-h3` | Fluid type scale. One `text-h1` per page. |
| `overline` | Small caps label; always with `lang="en"` (html lang is `tr`: "i" → "İ"). |
| `tnum` | Tabular numbers: prices, dates, counts, scores. |
| `panel` / `card` / `card-hover` | Raised panel (16 r, shadow) / flat card (12 r) / interactive hover. |
| `glass` | Sticky bars over content (header, tab bar, mobile CTA). |
| `field` | Inputs, selects, textareas. |
| `link` | Inline text link. |
| `no-scrollbar` | Horizontal scrollers. |
| `prose-sofo` | Long-form copy (about, privacy). |

## Components

- `components/ui/button.tsx` — `buttonClass(variant, size)`: `primary` (black on orange, 6.4:1), `secondary`, `ghost`, `glass` (on imagery), `quiet`; sizes `lg` 48 / `md` 44 / `sm` 36. `iconButtonClass`.
- `components/ui/chip.tsx` — `ChipLink`, `Chip`, `ChipRow` (swipe on phones, wrap from md). Active chip = white.
- `components/ui/badges.tsx` — poster badges (`DubBadge`, `SubBadge`, `NewBadge`, `LeavingBadge`, `FreeBadge`, `MutedBadge`), soft `Pill tone=…`, `LangMark` (✓ / — / not confirmed).
- `components/ui/section-header.tsx` — the title is the link (chevron) when `href` is set; optional `sub`, `action`.
- `components/ui/poster-card.tsx`, `poster-row.tsx` (`Rail` with paging arrows), `poster-grid.tsx`, `poster-image.tsx`, `quick-save.tsx`.
- `components/ui/page-hero.tsx` — hub/listing header: `eyebrow`, `title`, `intro`, `aside`, children.
- `components/ui/empty-state.tsx`, `breadcrumbs.tsx`, `checked-at.tsx`, `service-logo.tsx`.
- `components/icons.tsx` — one stroke icon set (24 grid, 2 px). No emoji, no text glyph arrows (`→ ↗ ▸ ✓`) in UI: use icons.
- `components/home/promo-slider.tsx` — centred promo carousel with dimmed neighbours.
- `components/retention/dialog.tsx` — modal on md+, bottom sheet on phones.

## Layout

- Breakpoints: xs 360 (3 posters) · sm 480 (4) · md 768 (5) · lg 1024 (6) · xl 1280 (7, max 1360).
- < md: bottom tab bar (58 px + safe area); filters and modals are bottom sheets; title page has a sticky CTA above the tab bar.
- Touch targets ≥ 44 px (`md` buttons, `iconButtonClass("md")`); `sm` (36) only in dense desktop rows.
- Contrast: body text ≥ 4.5:1. `text-3` only for meta ≥ 12 px. White on orange only ≥ 18 px bold or the logo.

## Page patterns

- **Home** — promo slider → search (h1) → Top 10 → service tiles → language cards → rails → collections → subscribe.
- **Title** — full-bleed backdrop hero: poster · title/meta/language pills · *the short answer* + CTA · where-to-watch panel; fact strip; two columns (content + sticky aside: follow, details).
- **Listings / hubs** — `PageHero` → filters (chips or sidebar) → `PosterGrid`.
