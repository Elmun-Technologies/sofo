# Sofo design system — DS3 "cinema" (2026-11-24)

Founder brief (2026-11-24): the DS2 build read as "cartoonish and simple". Brand stays (Sofo Orange, Manrope, Nunito Black logo). Tokens live in `app/globals.css` (`@theme`).

## Direction (2026-11-24, revised): "clean"

The first DS3 pass (violet-tinted, tight radii, heavy weights) still felt toy-like. Founder references:
the QClay agency deck (airy, oversized light type, pill controls, big rounded bento surfaces, generous
whitespace, thin hairline rules, outlined pill tags) and ivi.ru (imagery-led dark catalogue). Product
remains a dark cinema UI, but typography, radii and chrome now follow that clean, editorial language.

## Principles

1. **Imagery carries the page, chrome is almost invisible.** Near-black neutral surfaces (no tint), 1 px alpha hairlines, no shadows on panels, no glow blobs, no gradients behind text.
2. **Type does the design.** Large, light, tightly-tracked headlines (weight 500, -0.04em). Body 400/500. Small labels 500. Never bold-heavy. Numerals can be oversized and light (`numeral`).
3. **Pills and bento.** Every control is a pill (`rounded-full`): buttons, chips, tags, inputs-with-search. Containers are big soft rounded blocks (card 20, panel 24, hero 28) separated by 8–16 px gaps, like a bento grid; use them to group content rather than lines.
4. **Colour is meaning, used sparingly.** White is the primary action (white pill, black text). Sofo Orange is reserved for the **outbound "Watch on <service>" action**, the logo and nothing else. Semantic colours (dub `#3B82F6`, available `#4ADE80`, leaving `#FBBF24`, free `#A78BFA`) appear only as 6 px dots, thin outlines and text — never solid fills (exception: none).
5. **Whitespace is a feature.** Section rhythm 56–96 px on desktop (`section-y` is the minimum). Fewer elements per screen, each with room.
6. **Facts on demand.** Resting cards are quiet; hover reveals score/year/genres/languages.
7. **Never guess.** Unknown language = "not confirmed" (leaving tone). Every availability shows `checked_at`.
8. **Editorial details.** Thin `rule` dividers with a heading beneath, section counters ("01."), outlined `tag` labels, arrow-in-circle links, a one-line intro paragraph per section.

## Tokens

- Neutrals: `ink #09090B` (page), `ink-2 #0D0D0F`, `surface #131316`, `surface-2 #1B1B1F`, `surface-3 #26262B`; borders `hairline` (white 7%) and `hairline-strong` (white 14%). Text `text` / `text-2 #A3A3AD` / `text-3 #70707A`.
- Radii: poster 12 · input 14 · card 20 · panel 24 · hero 28 · chip/button/tag `rounded-full`.
- Weights are remapped: `font-medium` 500, `font-semibold` 500, `font-bold` 600, `font-extrabold` 600 (700+ never; 800 is the logo only). Prefer `font-medium` for UI and `font-semibold` for emphasis.
- Type scale utilities: `text-display` (500, up to 76 px), `text-h1`, `text-h2`, `text-h3`, `overline`, `numeral`.
- Focus ring: 2 px white. Selection: white on black.
- Motion: `ease-out` 150–300 ms. `animate-fade-up`, `animate-pop-in`, `animate-sheet-up`. Reduced motion honoured globally.

## Utilities (`app/globals.css`)

| Utility | Use |
| --- | --- |
| `wrap` | Page container (max 1360, gutters 16 / 28). |
| `section-y` | Minimum vertical rhythm; prefer `py-10 md:py-20` between major sections. |
| `text-display` `text-h1` `text-h2` `text-h3` `numeral` | Type scale. One `text-h1` (or `text-display`) per page. |
| `overline` | Small caps label; always with `lang="en"` (html lang is `tr`: "i" → "İ"). |
| `tnum` | Tabular numbers for prices, dates, counts. |
| `panel` / `card` / `card-hover` | Big bento surface (24 r) / card (20 r) / interactive hover. No shadow. |
| `rule` | 1 px divider. |
| `tag` | Outlined pill label (non-interactive). |
| `glass` | Sticky bars over content. |
| `field` | Inputs, selects, textareas (14 r, white focus ring). |
| `link` | Inline text link. |
| `no-scrollbar` | Horizontal scrollers. |
| `prose-sofo` | Long-form copy. |

## Components

- `components/ui/button.tsx` — `buttonClass(variant, size)`: `primary` (white pill), `accent` (orange — outbound only), `secondary` (white/10), `ghost` (outline), `glass` (on imagery), `quiet`; sizes `lg` 52 / `md` 44 / `sm` 36. `iconButtonClass(size, tone)` is a round icon button.
- `components/ui/chip.tsx` — outlined pill chips; active = white fill.
- `components/ui/badges.tsx` — poster badges are monochrome glass pills with one semantic dot (`DubBadge`, `SubBadge`, `NewBadge` = white, `LeavingBadge`, `FreeBadge`, `MutedBadge`); `Pill tone=…` is an outlined pill; `LangMark`.
- `components/ui/section-header.tsx`, `poster-card.tsx`, `poster-row.tsx` (`Rail`), `poster-grid.tsx`, `poster-image.tsx`, `quick-save.tsx`, `page-hero.tsx`, `empty-state.tsx`, `breadcrumbs.tsx`, `checked-at.tsx`, `service-logo.tsx`.
- `components/icons.tsx` — one stroke icon set. No emoji, no glyph arrows in UI.
- `components/home/promo-slider.tsx`, `components/retention/dialog.tsx` (modal / bottom sheet).

## Layout

- Breakpoints: xs 360 (3 posters) · sm 480 (4) · md 768 (5) · lg 1024 (6) · xl 1280 (7, max 1360).
- < md: bottom tab bar (58 px + safe area); filters and modals are bottom sheets; title page has a sticky CTA above the tab bar.
- Touch targets ≥ 44 px (`md` buttons, `iconButtonClass("md")`); `sm` (36) only in dense desktop rows.
- Contrast: body text ≥ 4.5:1. `text-3` only for meta ≥ 12 px. White on orange only ≥ 18 px bold or the logo.

## Page patterns

- **Home** — promo slider → search (h1) → Top 10 → service tiles → language cards → rails → collections → subscribe.
- **Title** — full-bleed backdrop hero: poster · title/meta/language pills · *the short answer* + CTA · where-to-watch panel; fact strip; two columns (content + sticky aside: follow, details).
- **Listings / hubs** — `PageHero` → filters (chips or sidebar) → `PosterGrid`.
