-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('movie', 'tv');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('subscription', 'free', 'ads', 'rent', 'buy');

-- CreateEnum
CREATE TYPE "LangKind" AS ENUM ('audio', 'subtitle');

-- CreateEnum
CREATE TYPE "LangStatus" AS ENUM ('confirmed_yes', 'confirmed_no', 'unknown');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('added', 'removed', 'price_change', 'quality_change', 'audio_added', 'audio_removed', 'subtitle_added', 'subtitle_removed', 'leaving_announced');

-- CreateEnum
CREATE TYPE "VideoKind" AS ENUM ('trailer', 'teaser', 'clip', 'featurette', 'episode_preview', 'short');

-- CreateEnum
CREATE TYPE "ReleaseStage" AS ENUM ('theatrical', 'digital', 'subscription', 'dub');

-- CreateEnum
CREATE TYPE "IndexStatus" AS ENUM ('index', 'noindex');

-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('not_on_service', 'wrong_language', 'wrong_price', 'broken_link', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'rechecking', 'fixed', 'rejected');

-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('dub_available', 'new_episode', 'leaving', 'price_drop', 'on_my_services', 'release');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('telegram', 'email', 'web_push');

-- CreateTable
CREATE TABLE "title" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "type" "TitleType" NOT NULL,
    "original_title" TEXT NOT NULL,
    "original_lang" VARCHAR(8) NOT NULL,
    "year" INTEGER,
    "runtime_min" INTEGER,
    "age_rating" TEXT,
    "tmdb_score" DECIMAL(3,1),
    "popularity" DOUBLE PRECISION,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "genres" TEXT[],
    "is_animation" BOOLEAN NOT NULL DEFAULT false,
    "is_kids" BOOLEAN NOT NULL DEFAULT false,
    "franchise_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "title_localization" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "alt_names" TEXT[],
    "overview" TEXT,
    "slug" TEXT NOT NULL,

    CONSTRAINT "title_localization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "air_date" DATE,
    "episode_count" INTEGER,
    "tmdb_score" DECIMAL(3,1),
    "poster_path" TEXT,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "overview" TEXT,
    "air_date" DATE,
    "runtime_min" INTEGER,
    "tmdb_score" DECIMAL(3,1),
    "still_path" TEXT,

    CONSTRAINT "episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "birthday" DATE,
    "known_for" TEXT,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "job" TEXT NOT NULL,
    "character" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franchise" (
    "id" SERIAL NOT NULL,
    "tmdb_collection_id" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franchise_item" (
    "id" SERIAL NOT NULL,
    "franchise_id" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "release_order" INTEGER NOT NULL,
    "story_order" INTEGER,
    "kind" TEXT NOT NULL DEFAULT 'main',

    CONSTRAINT "franchise_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "ui_langs" TEXT[],

    CONSTRAINT "country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "service" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_path" TEXT,
    "deeplink_template" TEXT,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_country" (
    "service_id" INTEGER NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "price_from" DECIMAL(10,2),
    "currency" CHAR(3),
    "has_ads_tier" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "service_country_pkey" PRIMARY KEY ("service_id","country_code")
);

-- CreateTable
CREATE TABLE "offer" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "season_id" INTEGER,
    "episode_id" INTEGER,
    "country_code" CHAR(2) NOT NULL,
    "service_id" INTEGER NOT NULL,
    "type" "OfferType" NOT NULL,
    "quality" TEXT,
    "price" DECIMAL(10,2),
    "currency" CHAR(3),
    "url" TEXT NOT NULL,
    "leaving_at" DATE,
    "source" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_language" (
    "offer_id" INTEGER NOT NULL,
    "lang" VARCHAR(16) NOT NULL,
    "kind" "LangKind" NOT NULL,
    "status" "LangStatus" NOT NULL DEFAULT 'unknown',

    CONSTRAINT "offer_language_pkey" PRIMARY KEY ("offer_id","lang","kind")
);

-- CreateTable
CREATE TABLE "availability_event" (
    "id" BIGSERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "service_id" INTEGER NOT NULL,
    "type" "EventType" NOT NULL,
    "offer_type" "OfferType",
    "before" JSONB,
    "after" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_track" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "stage" "ReleaseStage" NOT NULL,
    "date" DATE,
    "is_estimate" BOOLEAN NOT NULL DEFAULT false,
    "service_id" INTEGER,
    "lang" VARCHAR(16),
    "source" TEXT NOT NULL,

    CONSTRAINT "release_track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "season_id" INTEGER,
    "episode_id" INTEGER,
    "site" TEXT NOT NULL DEFAULT 'youtube',
    "key" TEXT NOT NULL,
    "kind" "VideoKind" NOT NULL,
    "name" TEXT NOT NULL,
    "lang" VARCHAR(16),
    "is_official" BOOLEAN NOT NULL DEFAULT true,
    "is_vertical" BOOLEAN NOT NULL DEFAULT false,
    "duration_sec" INTEGER,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list" (
    "id" SERIAL NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'sofo editors',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_item" (
    "list_id" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "blurb" TEXT,

    CONSTRAINT "list_item_pkey" PRIMARY KEY ("list_id","title_id")
);

-- CreateTable
CREATE TABLE "page" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "entity_id" INTEGER,
    "index_status" "IndexStatus" NOT NULL DEFAULT 'noindex',
    "quality_note" TEXT,
    "hreflang_key" TEXT,
    "last_built_at" TIMESTAMP(3),

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "telegram_id" BIGINT,
    "google_sub" TEXT,
    "country_code" CHAR(2) NOT NULL DEFAULT 'TR',
    "ui_lang" VARCHAR(8) NOT NULL DEFAULT 'en',
    "audio_pref" VARCHAR(16),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_service" (
    "user_id" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,

    CONSTRAINT "user_service_pkey" PRIMARY KEY ("user_id","service_id")
);

-- CreateTable
CREATE TABLE "watchlist_item" (
    "user_id" TEXT NOT NULL,
    "title_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "watchlist_item_pkey" PRIMARY KEY ("user_id","title_id")
);

-- CreateTable
CREATE TABLE "alert" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" INTEGER NOT NULL,
    "kinds" "AlertKind"[],
    "channel" "Channel" NOT NULL DEFAULT 'telegram',
    "last_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_report" (
    "id" SERIAL NOT NULL,
    "title_id" INTEGER NOT NULL,
    "offer_id" INTEGER,
    "kind" "ReportKind" NOT NULL,
    "note" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "error_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_stat" (
    "day" DATE NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "zero_results" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "search_stat_pkey" PRIMARY KEY ("day","country_code","query")
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
-- Manual: NULLS NOT DISTINCT so (title, country, stage, lang=NULL) cannot be duplicated (PG15+).
CREATE UNIQUE INDEX "release_track_title_id_country_code_stage_lang_key" ON "release_track"("title_id", "country_code", "stage", "lang") NULLS NOT DISTINCT;

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

-- AddForeignKey
ALTER TABLE "title" ADD CONSTRAINT "title_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_localization" ADD CONSTRAINT "title_localization_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode" ADD CONSTRAINT "episode_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit" ADD CONSTRAINT "credit_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit" ADD CONSTRAINT "credit_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "franchise_item" ADD CONSTRAINT "franchise_item_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "franchise_item" ADD CONSTRAINT "franchise_item_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_country" ADD CONSTRAINT "service_country_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_country" ADD CONSTRAINT "service_country_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_language" ADD CONSTRAINT "offer_language_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_event" ADD CONSTRAINT "availability_event_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_event" ADD CONSTRAINT "availability_event_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_track" ADD CONSTRAINT "release_track_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_item" ADD CONSTRAINT "list_item_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_item" ADD CONSTRAINT "list_item_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_service" ADD CONSTRAINT "user_service_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_service" ADD CONSTRAINT "user_service_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_item" ADD CONSTRAINT "watchlist_item_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_item" ADD CONSTRAINT "watchlist_item_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_report" ADD CONSTRAINT "error_report_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_report" ADD CONSTRAINT "error_report_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ───────────── Manual: search (docs/data-model.md §6) ─────────────
-- unaccent() is only STABLE, so it cannot be used in an index directly.
-- This IMMUTABLE wrapper pins the dictionary; queries must call sofo_unaccent() to hit the indexes.
-- search_path covers Supabase, where extensions live in the "extensions" schema.
CREATE OR REPLACE FUNCTION sofo_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  SET search_path = public, extensions
  AS $$ SELECT unaccent('unaccent'::regdictionary, $1) $$;

CREATE INDEX "title_loc_name_trgm" ON "title_localization" USING gin (sofo_unaccent("name") gin_trgm_ops);
CREATE INDEX "title_original_title_trgm" ON "title" USING gin (sofo_unaccent("original_title") gin_trgm_ops);
