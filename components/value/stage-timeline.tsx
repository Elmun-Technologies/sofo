import type { ReleaseStage } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { langName } from "@/lib/lang";
import { STAGE_ORDER, type TrackStage } from "@/lib/queries/value-pages";

type State = "done" | "confirmed" | "estimate" | "unknown";

function stageLabel(stage: ReleaseStage, editionLang: string, type: "movie" | "tv") {
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

function stateOf(s: TrackStage | undefined): State {
  if (!s || !s.date) return "unknown";
  if (s.past) return "done";
  return s.isEstimate ? "estimate" : "confirmed";
}

function when(s: TrackStage | undefined, state: State) {
  if (!s || !s.date) return "not announced";
  const d = formatDate(s.date, { month: "short", year: "numeric", timeZone: "UTC" });
  const exact = formatDate(s.date, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const date = state === "estimate" ? `~ ${d}` : state === "done" ? d : exact;
  return s.service ? `${date} · ${s.service}` : date;
}

const DOT: Record<State, string> = {
  done: "bg-surface-2 text-available",
  confirmed: "bg-orange text-ink",
  estimate: "bg-leaving text-ink",
  unknown: "bg-surface-2 text-text-3",
};

function Dot({ state }: { state: State }) {
  return (
    <span className={`relative z-10 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold ${DOT[state]}`} aria-hidden="true">
      {state === "done" || state === "confirmed" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : state === "estimate" ? (
        "~"
      ) : (
        "?"
      )}
    </span>
  );
}

const STATE_TEXT: Record<State, string> = { done: "done", confirmed: "confirmed date", estimate: "our estimate", unknown: "not announced" };

/**
 * theatrical → digital → subscription → dub. Past stages muted, confirmed upcoming orange,
 * estimates amber with "~" (V5: never shown as a confirmed date).
 */
export function StageTimeline({ stages, editionLang, type }: { stages: TrackStage[]; editionLang: string; type: "movie" | "tv" }) {
  const byStage = new Map(stages.map((s) => [s.stage, s]));
  return (
    <ol className="flex flex-col gap-3 md:grid md:grid-cols-4 md:gap-0">
      {STAGE_ORDER.map((stage, i) => {
        const s = byStage.get(stage);
        const state = stateOf(s);
        const next = byStage.get(STAGE_ORDER[i + 1]!);
        const lineDone = state === "done" && stateOf(next) === "done";
        return (
          <li key={stage} className="relative flex items-center gap-3 md:block" title={s?.isEstimate ? `Estimate — ${s.source}` : s?.source}>
            {i < STAGE_ORDER.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute top-3 right-3 left-9 hidden h-0.5 md:block ${lineDone ? "bg-available/50" : state === "unknown" ? "bg-line" : "bg-leaving/40"}`}
              />
            ) : null}
            <Dot state={state} />
            <div className={`flex min-w-0 grow items-baseline justify-between gap-3 md:mt-2.5 md:block md:pr-4 ${state === "done" ? "opacity-60" : ""}`}>
              <p className="text-sm font-extrabold md:text-[15px]">{stageLabel(stage, editionLang, type)}</p>
              <p
                className={`text-right text-[13px] md:mt-0.5 md:text-left ${state === "estimate" ? "text-leaving" : state === "confirmed" ? "text-orange" : "text-text-2"}`}
              >
                {when(s, state)}
                <span className="sr-only"> ({STATE_TEXT[state]})</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
