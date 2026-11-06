-- CreateTable
CREATE TABLE "title" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdb_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "original_title" TEXT NOT NULL,
    "original_lang" TEXT NOT NULL,
    "year" INTEGER,
    "runtime_min" INTEGER,
    "age_rating" TEXT,
    "tmdb_score" DECIMAL,
    "popularity" REAL,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "genres" TEXT NOT NULL DEFAULT '[]',
    "is_animation" BOOLEAN NOT NULL DEFAULT false,
    "is_kids" BOOLEAN NOT NULL DEFAULT false,
    "franchise_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "title_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "title_localization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alt_names" TEXT NOT NULL DEFAULT '[]',
    "overview" TEXT,
    "slug" TEXT NOT NULL,
    CONSTRAINT "title_localization_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "air_date" DATETIME,
    "episode_count" INTEGER,
    "tmdb_score" DECIMAL,
    "poster_path" TEXT,
    CONSTRAINT "season_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "season_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "overview" TEXT,
    "air_date" DATETIME,
    "runtime_min" INTEGER,
    "tmdb_score" DECIMAL,
    "still_path" TEXT,
    CONSTRAINT "episode_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "person" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdb_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "birthday" DATETIME,
    "known_for" TEXT
);

-- CreateTable
CREATE TABLE "credit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "job" TEXT NOT NULL,
    "character" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "credit_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credit_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "franchise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdb_collection_id" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "franchise_item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "franchise_id" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "release_order" INTEGER NOT NULL,
    "story_order" INTEGER,
    "kind" TEXT NOT NULL DEFAULT 'main',
    CONSTRAINT "franchise_item_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "franchise_item_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "country" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ui_langs" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_path" TEXT,
    "deeplink_template" TEXT
);

-- CreateTable
CREATE TABLE "service_country" (
    "service_id" INTEGER NOT NULL,
    "country_code" TEXT NOT NULL,
    "price_from" DECIMAL,
    "currency" TEXT,
    "has_ads_tier" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("service_id", "country_code"),
    CONSTRAINT "service_country_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_country_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "country" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "season_id" INTEGER,
    "episode_id" INTEGER,
    "country_code" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quality" TEXT,
    "price" DECIMAL,
    "currency" TEXT,
    "url" TEXT NOT NULL,
    "leaving_at" DATETIME,
    "source" TEXT NOT NULL,
    "first_seen_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "offer_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offer_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offer_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offer_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "offer_language" (
    "offer_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',

    PRIMARY KEY ("offer_id", "lang", "kind"),
    CONSTRAINT "offer_language_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "availability_event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "country_code" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "offer_type" TEXT,
    "before" JSONB,
    "after" JSONB,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_event_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "availability_event_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "release_track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "country_code" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "date" DATETIME,
    "is_estimate" BOOLEAN NOT NULL DEFAULT false,
    "service_id" INTEGER,
    "lang" TEXT,
    "source" TEXT NOT NULL,
    CONSTRAINT "release_track_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "season_id" INTEGER,
    "episode_id" INTEGER,
    "site" TEXT NOT NULL DEFAULT 'youtube',
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lang" TEXT,
    "is_official" BOOLEAN NOT NULL DEFAULT true,
    "is_vertical" BOOLEAN NOT NULL DEFAULT false,
    "duration_sec" INTEGER,
    "published_at" DATETIME,
    CONSTRAINT "video_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "video_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "video_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "list" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lang" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'sofo editors',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "list_item" (
    "list_id" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "blurb" TEXT,

    PRIMARY KEY ("list_id", "title_id"),
    CONSTRAINT "list_item_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "list" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "list_item_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "entity_id" INTEGER,
    "index_status" TEXT NOT NULL DEFAULT 'noindex',
    "quality_note" TEXT,
    "hreflang_key" TEXT,
    "last_built_at" DATETIME
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "telegram_id" BIGINT,
    "google_sub" TEXT,
    "country_code" TEXT NOT NULL DEFAULT 'TR',
    "ui_lang" TEXT NOT NULL DEFAULT 'en',
    "audio_pref" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_service" (
    "user_id" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "service_id"),
    CONSTRAINT "user_service_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_service_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "watchlist_item" (
    "user_id" TEXT NOT NULL,
    "title_id" INTEGER NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watched" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("user_id", "title_id"),
    CONSTRAINT "watchlist_item_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "watchlist_item_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "title_id" INTEGER NOT NULL,
    "kinds" TEXT NOT NULL DEFAULT '[]',
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "last_sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alert_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "error_report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title_id" INTEGER NOT NULL,
    "offer_id" INTEGER,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    CONSTRAINT "error_report_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "error_report_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "search_stat" (
    "day" DATETIME NOT NULL,
    "country_code" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "zero_results" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("day", "country_code", "query")
);

-- CreateIndex
CREATE INDEX "title_franchise_id_idx" ON "title"("franchise_id");

-- CreateIndex
CREATE UNIQUE INDEX "title_tmdb_id_type_key" ON "title"("tmdb_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "title_localization_title_id_lang_key" ON "title_localization"("title_id", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "title_localization_lang_slug_key" ON "title_localization"("lang", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "season_title_id_number_key" ON "season"("title_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "episode_season_id_number_key" ON "episode"("season_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "person_tmdb_id_key" ON "person"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_slug_key" ON "person"("slug");

-- CreateIndex
CREATE INDEX "credit_person_id_idx" ON "credit"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_title_id_person_id_job_character_key" ON "credit"("title_id", "person_id", "job", "character");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_tmdb_collection_id_key" ON "franchise"("tmdb_collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_slug_key" ON "franchise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_item_franchise_id_title_id_key" ON "franchise_item"("franchise_id", "title_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_slug_key" ON "service"("slug");

-- CreateIndex
CREATE INDEX "offer_title_id_country_code_is_active_idx" ON "offer"("title_id", "country_code", "is_active");

-- CreateIndex
CREATE INDEX "offer_country_code_service_id_is_active_idx" ON "offer"("country_code", "service_id", "is_active");

-- CreateIndex
CREATE INDEX "offer_leaving_at_idx" ON "offer"("leaving_at");

-- CreateIndex
CREATE INDEX "offer_language_lang_kind_status_idx" ON "offer_language"("lang", "kind", "status");

-- CreateIndex
CREATE INDEX "availability_event_title_id_country_code_occurred_at_idx" ON "availability_event"("title_id", "country_code", "occurred_at");

-- CreateIndex
CREATE INDEX "availability_event_occurred_at_idx" ON "availability_event"("occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "release_track_title_id_country_code_stage_lang_key" ON "release_track"("title_id", "country_code", "stage", "lang");

-- CreateIndex
CREATE INDEX "video_title_id_lang_idx" ON "video"("title_id", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "video_site_key_key" ON "video"("site", "key");

-- CreateIndex
CREATE UNIQUE INDEX "list_lang_slug_key" ON "list"("lang", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "page_path_key" ON "page"("path");

-- CreateIndex
CREATE INDEX "page_index_status_type_idx" ON "page"("index_status", "type");

-- CreateIndex
CREATE INDEX "page_hreflang_key_idx" ON "page"("hreflang_key");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_telegram_id_key" ON "app_user"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_google_sub_key" ON "app_user"("google_sub");

-- CreateIndex
CREATE UNIQUE INDEX "alert_user_id_title_id_key" ON "alert"("user_id", "title_id");

-- CreateIndex
CREATE INDEX "error_report_status_created_at_idx" ON "error_report"("status", "created_at");


-- Manual: search helpers. SQLite has no pg_trgm/unaccent; lib/search.ts ranks in TypeScript.
CREATE INDEX "title_localization_lang_name_idx" ON "title_localization"("lang", "name");
