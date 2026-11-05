"use client";
import { linkTmdbId } from "@/lib/admin/actions";
import { ActionForm, SubmitButton } from "./action-form";

/** Entity resolution: re-link a title to the right TMDB id (validated + uniqueness-checked server-side). */
export function TmdbLinkForm({ titleId, tmdbId, type }: { titleId: number; tmdbId: number; type: "movie" | "tv" }) {
  return (
    <ActionForm action={linkTmdbId} className="flex flex-wrap items-center justify-end gap-2" messageClassName="basis-full text-right">
      <input type="hidden" name="titleId" value={titleId} />
      <label className="sr-only" htmlFor={`tmdb-${titleId}`}>
        TMDB id
      </label>
      <span className="text-xs text-text-3">TMDB {type}/</span>
      <input
        id={`tmdb-${titleId}`}
        name="tmdbId"
        defaultValue={tmdbId}
        inputMode="numeric"
        required
        maxLength={300}
        placeholder="id or URL"
        className="h-9 w-36 rounded-input border border-line bg-ink px-2.5 text-sm tabular-nums focus:border-orange focus:outline-none"
      />
      <SubmitButton>Link TMDB ID</SubmitButton>
    </ActionForm>
  );
}
