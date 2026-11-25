-- Base reference data for real (ingested) catalogues — independent of the demo seed.
-- 2026-11-25 (TASK-006): MVP services = those the Streaming Availability API covers in TR.
-- TOD, tabii, Exxen, Gain are not covered by any source yet → not seeded (docs/research/2026-11-25-streaming-availability-tr.md).
-- Plan prices are left NULL on purpose: the API does not provide them and we never guess (UI shows "Subscription").
INSERT OR IGNORE INTO "country" ("code", "name", "ui_langs") VALUES ('TR', 'Türkiye', '["tr","en"]');
INSERT OR IGNORE INTO "service" ("slug", "name") VALUES ('netflix', 'Netflix');
INSERT OR IGNORE INTO "service" ("slug", "name") VALUES ('prime-video', 'Prime Video');
INSERT OR IGNORE INTO "service" ("slug", "name") VALUES ('disney-plus', 'Disney+');
INSERT OR IGNORE INTO "service" ("slug", "name") VALUES ('hbo-max', 'HBO Max');
INSERT OR IGNORE INTO "service" ("slug", "name") VALUES ('crunchyroll', 'Crunchyroll');
INSERT OR IGNORE INTO "service_country" ("service_id", "country_code", "has_ads_tier") SELECT "id", 'TR', false FROM "service" WHERE "slug" IN ('netflix', 'prime-video', 'disney-plus', 'hbo-max', 'crunchyroll');
