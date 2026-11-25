# Streaming Availability API — Türkiye coverage check (TASK-006)

Date: 2026-11-25 · Source: Streaming Availability API v4 (movieofthenight.com, founder's key) · Sample: the 30 titles in `data/titles.csv`.

## Services the API covers in Türkiye (`/v4/countries/tr`)

| Covered | Offer types |
| --- | --- |
| Netflix | subscription |
| Prime Video | subscription, free, rent, buy, add-ons (5) |
| Disney+ | subscription |
| HBO Max | subscription |
| Mubi | subscription |
| Crunchyroll | subscription |
| Curiosity Stream | subscription |
| Zee5 | subscription |

**Not covered: TOD, tabii, Exxen, Gain** — 4 of the 8 MVP services (2026-11-02 decision).

## Title-level result (30 popular titles)

- Available on a legal service in TR: **30 / 30**
- Turkish audio (türkçe dublaj) listed by the service: **26 / 30**
- Turkish subtitles listed: **28 / 30**
- Audio/subtitle lists come as ISO 639-2 (`tur`); the ingest maps them to `tr`.

Gaps are anime: Crunchyroll options carry **no audio/subtitle lists at all** (Attack on Titan, One Piece, Demon Slayer, Jujutsu Kaisen), and some Netflix anime options are empty too. Under our rule these stay `unknown` ("Not confirmed by the service"), never "no dub".

## Decisions needed (founder)

1. **TOD, tabii, Exxen, Gain** have no data source. Options: (a) keep their service pages but show only manually verified titles (admin curation), (b) check Watchmode as a second source, (c) drop them from the MVP service list until a source exists.
2. **Crunchyroll and Mubi** are covered but not in our service map. Crunchyroll matters for the anime section (with "language not confirmed" until the API lists languages).
3. Plan/price of the API at the volume we need (≈500 titles × daily refresh) — check the plan limits before the cron runs daily.

## How the key is used in this environment

Keys are saved as session network secrets (proxy-injected headers), not in env vars. Scripts still need a placeholder so they start:

```bash
TMDB_API_KEY=eyJproxy-injected STREAMING_AVAILABILITY_API_KEY=proxy-injected pnpm ingest:availability -- --limit=5 --dry-run
```
