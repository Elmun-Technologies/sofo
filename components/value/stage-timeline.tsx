import type { ReleaseStage } from "@prisma/client";
import { CheckIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { langName } from "@/lib/lang";
import { STAGE_ORDER, type TrackStage } from "@/lib/queries/value-pages";

type State = "done" | "confirmed" | "estimate" | "unknown";

export function stageLabel(stage: ReleaseStage, editionLang: string, type: "movie" | "tv") {
  switch (stage) {
    case "theatrical":
      return type === "tv" ? "Premiere" : "In theaters";
    case "digital":
      return "Rent / buy";
    case "subscription":
      return "Subscription";
    case "dub":
      return `${langName(editionLang)} dub`;
  }
}

export function stageState(s: TrackStage | undefined): State {
  if (!s || !s.date) return "unknown";
  if (s.past) return "done";
  return s.isEstimate ? "estimate" : "confirmed";
}

/** Date label for a stage. Estimates are month-only and always carry "~" (never shown as a confirmed date). */
export function stageWhen(s: TrackStage | undefined, state: State = stageState(s)) {
  if (!s || !s.date) return "Not announced";
  const month = formatDate(s.date, { month: "short", year: "numeric", timeZone: "UTC" });
  if (state === "estimate") return `~ ${month}`;
  if (state === "done") return month;
  return formatDate(s.date, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Where a date comes from, in words ("estimate: typical window" → "typical window"). */
export function stageSource(s: TrackStage) {
  return s.source.replace(/^estimate:\s*/i, "");
}

const STATE_TEXT: Record<State, string> = { done: "done", confirmed: "confirmed date", estimate: "our estimate", unknown: "not announced" };

const NODE: Record<State, string> = {
  done: "bg-surface-3 text-text-2",
  confirmed: "bg-text text-ink",
  estimate: "text-leaving ring-1 ring-leaving ring-inset",
  unknown: "ring-1 ring-hairline-strong ring-inset",
};

function Node({ state }: { state: State }) {
  return (
    <span aria-hidden="true" className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full text-[13px] leading-none font-medium ${NODE[state]}`}>
      {state === "done" ? <CheckIcon className="size-3 stroke-[3]" /> : state === "confirmed" ? <span className="size-1.5 rounded-full bg-ink" /> : state === "estimate" ? "~" : null}
    </span>
  );
}

const WHEN: Record<State, string> = { done: "text-text-2", confirmed: "text-text", estimate: "text-leaving", unknown: "text-text-3" };

/**
 * theatrical → digital → subscription → dub as a stepper: a row on desktop, a column on phones.
 * Past stages are quiet, the confirmed upcoming stage is white, estimates are amber with "~"
 * and their source spelled out (V5: never shown as a confirmed date).
 */
export function StageTimeline({ stages, editionLang, type }: { stages: TrackStage[]; editionLang: string; type: "movie" | "tv" }) {
  const byStage = new Map(stages.map((s) => [s.stage, s]));
  return (
    <ol className="grid grid-cols-1 md:grid-cols-4">
      {STAGE_ORDER.map((stage, i) => {
        const s = byStage.get(stage);
        const state = stageState(s);
        const last = i === STAGE_ORDER.length - 1;
        const reached = state === "done" && stageState(byStage.get(STAGE_ORDER[i + 1]!)) !== "unknown";
        const line = reached ? "bg-text/30" : "bg-hairline-strong";
        const detail = s && s.date ? [s.service, state === "estimate" ? `estimate — ${stageSource(s)}` : state === "confirmed" ? stageSource(s) : null].filter(Boolean).join(" · ") : "";
        return (
          <li key={stage} className={`relative flex gap-3.5 md:block md:pr-5 ${last ? "" : "pb-4 md:pb-0"}`} title={s?.isEstimate ? `Estimate — ${s.source}` : s?.source}>
            {/* connector: vertical on phones, horizontal from md */}
            {last ? null : (
              <>
                <span aria-hidden="true" className={`absolute top-5 bottom-0 left-[9.5px] w-px md:hidden ${line}`} />
                <span aria-hidden="true" className={`absolute top-[9.5px] right-0 left-5 hidden h-px md:block ${line}`} />
              </>
            )}
            <Node state={state} />
            <div className="min-w-0 flex-1 md:mt-3">
              <div className="flex items-baseline justify-between gap-3 md:block">
                <p className="text-[13px] leading-5 text-text-3">{stageLabel(stage, editionLang, type)}</p>
                <p className={`tnum text-sm leading-5 font-medium whitespace-nowrap md:mt-0.5 md:text-[15px] ${WHEN[state]}`}>
                  {stageWhen(s, state)}
                  <span className="sr-only"> ({STATE_TEXT[state]})</span>
                </p>
              </div>
              {detail ? <p className="mt-0.5 text-right text-xs leading-4 text-text-3 md:text-left">{detail}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
