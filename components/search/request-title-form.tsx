"use client";

import { useActionState } from "react";
import { buttonClass } from "../ui/button";

export type RequestState = { status: "idle" } | { status: "done"; title: string } | { status: "error"; message: string };

type Props = {
  action: (prev: RequestState, form: FormData) => Promise<RequestState>;
  lang: string;
  defaultTitle: string;
  countryName: string;
};

/** Small "Request this title" form; posts to a server action that only bumps an aggregate counter. */
export function RequestTitleForm({ action, lang, defaultTitle, countryName }: Props) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  if (state.status === "done") {
    return (
      <p role="status" className="rounded-input bg-surface-2 px-4 py-3 text-sm font-semibold">
        <span className="text-available">✓</span> Thanks — we&apos;ll look for “{state.title}” on legal services in {countryName}.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="lang" value={lang} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label htmlFor="request-title" className="sr-only">
        Title you are looking for
      </label>
      <input
        id="request-title"
        name="title"
        required
        minLength={2}
        maxLength={100}
        defaultValue={defaultTitle}
        className="h-11 min-w-0 flex-1 rounded-input border border-line bg-ink px-3.5 text-sm font-semibold outline-none focus:border-orange"
      />
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Sending…" : "Request this title"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-leaving sm:basis-full">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
