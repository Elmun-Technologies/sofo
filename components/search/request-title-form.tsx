"use client";

import { useActionState } from "react";
import { CheckIcon } from "../icons";
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
      <p role="status" className="animate-fade-up flex items-start gap-3 rounded-card border border-available/25 px-4 py-3.5 text-sm font-medium">
        <span aria-hidden="true" className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-available/15 text-available">
          <CheckIcon className="size-3 stroke-[3]" />
        </span>
        <span>
          Thanks — we&apos;ll look for “{state.title}” on legal services in {countryName}.
        </span>
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
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
        placeholder="Title you are looking for"
        className="field !h-[52px] sm:!w-auto sm:flex-1 sm:basis-56"
      />
      <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
        {pending ? "Sending…" : "Request this title"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-sm font-medium text-leaving sm:basis-full">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
