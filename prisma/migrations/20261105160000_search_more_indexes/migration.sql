-- Trigram search for people, franchises, lists and localized alt names (lib/search.ts).
-- array_to_string is only STABLE; this wrapper pins it for the index.
CREATE OR REPLACE FUNCTION sofo_alt_names(text[]) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  SET search_path = public, extensions
  AS $$ SELECT sofo_unaccent(array_to_string($1, ' ')) $$;

CREATE INDEX "person_name_trgm" ON "person" USING gin (sofo_unaccent("name") gin_trgm_ops);
CREATE INDEX "franchise_name_trgm" ON "franchise" USING gin (sofo_unaccent("name") gin_trgm_ops);
CREATE INDEX "list_name_trgm" ON "list" USING gin (sofo_unaccent("name") gin_trgm_ops);
CREATE INDEX "title_loc_alt_names_trgm" ON "title_localization" USING gin (sofo_alt_names("alt_names") gin_trgm_ops);
