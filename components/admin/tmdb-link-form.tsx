"use client";
import { linkTmdbId } from "@/lib/admin/actions";
import { ActionForm, SubmitButton } from "./action-form";

/** Entity resolution: re-link a title to the right TMDB id (validated + uniqueness-checked server-side). */
export function TmdbLinkForm({ titleId, tmdbId, type }: { titleId: number; tmdbId: number; type: "movie" | "tv" }) {
  return (
    <ActionForm action={linkTmdbId} className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end" messageClassName="basis-full md:text-right">
      <input type="hidden" name="titleId" value={titleId} />
      <label className="sr-only" htmlFor={`tmdb-${titleId}`}>
        TMDB id
      </label>
      <span className="tnum text-xs text-text-3">TMDB {type}/</span>
      <input
        id={`tmdb-${titleId}`}
        name="tmdbId"
        defaultValue={tmdbId}
        inputMode="numeric"
        required
        maxLength={300}
        placeholder="id or URL"
        className="field tnum !h-9 !w-28 !rounded-full !px-3.5 !text-[13px] sm:!w-36"
      />
      <SubmitButton>Link TMDB ID</SubmitButton>
    </ActionForm>
  );
}
