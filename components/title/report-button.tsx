"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitReport, type ReportState } from "@/app/actions/report";
import { buttonClass } from "@/components/ui/button";

const KINDS = [
  ["not_on_service", "It's not on this service"],
  ["wrong_language", "Wrong audio / subtitle info"],
  ["wrong_price", "Wrong price"],
  ["broken_link", "Link doesn't work"],
  ["other", "Something else"],
] as const;

/** "Something wrong? Tell us" — dialog (bottom sheet on mobile) posting an ErrorReport. */
export function ReportButton({ titleId, titleName, offers }: { titleId: number; titleName: string; offers: { id: number; label: string }[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<ReportState, FormData>(submitReport, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-text-2 underline decoration-white/20 underline-offset-2 hover:text-text">
        Something wrong? Tell us
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-md rounded-panel border border-hairline-strong bg-surface p-0 text-text shadow-pop backdrop:bg-black/70 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none"
      >
        <form action={action} className="p-5">
          <div className="flex items-start gap-3">
            <h2 className="text-h3 flex-1">What&apos;s wrong with “{titleName}”?</h2>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-text-2">
              ✕
            </button>
          </div>
          {state?.ok ? (
            <p className="mt-4 rounded-card bg-surface-2 p-4 text-sm">{state.message}</p>
          ) : (
            <>
              <input type="hidden" name="titleId" value={titleId} />
              <fieldset className="mt-4 grid gap-2">
                <legend className="sr-only">Problem</legend>
                {KINDS.map(([value, label], i) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-input border border-hairline-strong px-3 py-2.5 text-sm transition-colors hover:bg-white/5 has-[:checked]:border-orange has-[:checked]:bg-orange/8">
                    <input type="radio" name="kind" value={value} defaultChecked={i === 0} className="accent-[#FF5A1F]" />
                    {label}
                  </label>
                ))}
              </fieldset>
              {offers.length ? (
                <label className="mt-3 block text-sm">
                  <span className="text-text-2">Which option?</span>
                  <select name="offerId" className="field mt-1">
                    <option value="">Not sure</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="mt-3 block text-sm">
                <span className="text-text-2">Details (optional)</span>
                <textarea name="note" maxLength={500} rows={3} className="field mt-1 !h-auto py-3" />
              </label>
              {state && !state.ok ? <p className="mt-2 text-sm text-leaving">{state.message}</p> : null}
              <button type="submit" disabled={pending} className={`${buttonClass("primary")} mt-4 w-full`}>
                {pending ? "Sending…" : "Send report"}
              </button>
              <p className="mt-2 text-center text-xs text-text-3">We re-check reports within 24 hours. No account needed.</p>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
