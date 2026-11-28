-- Person photos (TMDB profile_path). Nullable: people without a photo keep the initials avatar.
ALTER TABLE "person" ADD COLUMN "photo_path" TEXT;
