import type { EventType, ReportStatus } from "@prisma/client";

export function AdminHeader({ title, right, eyebrow = "Admin" }: { title: string; right?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-8">
      <div>
        <p className="overline text-text-3">{eyebrow}</p>
        <h1 className="mt-2 text-[28px] leading-[1.1] font-medium tracking-[-0.035em] md:text-[36px]">{title}</h1>
      </div>
      {right ? <div className="flex items-center gap-3 text-sm text-text-2">{right}</div> : null}
    </div>
  );
}

export function Panel({ title, children, className = "", right }: { title?: string; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <section className={`panel min-w-0 p-5 sm:p-6 ${className}`}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[15px] leading-6 font-semibold tracking-[-0.01em]">{title}</h2>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Small-caps sub-heading inside a panel. */
export function PanelLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`overline text-text-3 ${className}`}>{children}</h2>;
}

const TONE_DOT = { default: "", good: "bg-available", warn: "bg-leaving", bad: "bg-red-400" } as const;
const TONE_TEXT = { default: "text-text-3", good: "text-text-3", warn: "text-leaving", bad: "text-red-300" } as const;

/** KPI tile: label, one large light numeral, a short note. Tone = a 6 px dot + the note colour, never a fill. */
export function Kpi({ label, value, sub, tone = "default" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" }) {
  return (
    <div className="panel flex min-w-0 flex-col p-5">
      <div className="flex items-center gap-2 text-[13px] font-medium text-text-2">
        {tone !== "default" ? <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`} /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="tnum mt-5 text-[34px] leading-none font-normal tracking-[-0.045em] whitespace-nowrap md:text-[40px]">{value}</div>
      {sub ? <div className={`tnum mt-3 text-xs ${TONE_TEXT[tone]}`}>{sub}</div> : null}
    </div>
  );
}

const pill = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] leading-none font-medium whitespace-nowrap ring-1 ring-inset";
const dot = "size-1.5 shrink-0 rounded-full";

const EVENT_DOT: Partial<Record<EventType, string>> = {
  added: "bg-available",
  audio_added: "bg-dub",
  subtitle_added: "bg-text/70",
  leaving_announced: "bg-leaving",
  price_change: "bg-free",
};

export function EventPill({ type }: { type: EventType }) {
  return (
    <span className={`${pill} text-text-2 ring-hairline-strong`}>
      <span aria-hidden="true" className={`${dot} ${EVENT_DOT[type] ?? "bg-text/30"}`} />
      {type === "leaving_announced" ? "leaving" : type.replace(/_/g, " ")}
    </span>
  );
}

const STATUS_TONE: Record<ReportStatus, { ring: string; dot: string }> = {
  open: { ring: "text-leaving ring-leaving/40", dot: "bg-leaving" },
  rechecking: { ring: "text-dub ring-dub/45", dot: "bg-dub" },
  fixed: { ring: "text-available ring-available/35", dot: "bg-available" },
  rejected: { ring: "text-text-3 ring-hairline-strong", dot: "bg-text/30" },
};

export function StatusPill({ status }: { status: ReportStatus }) {
  const t = STATUS_TONE[status];
  return (
    <span className={`${pill} ${t.ring}`}>
      <span aria-hidden="true" className={`${dot} ${t.dot}`} />
      {status}
    </span>
  );
}

export function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "dub" }) {
  const t = {
    default: "text-text-2 ring-hairline-strong",
    good: "text-available ring-available/35",
    warn: "text-leaving ring-leaving/35",
    dub: "text-dub ring-dub/45",
  }[tone];
  return <span className={`${pill} ${t}`}>{children}</span>;
}

/** Dense form control (shares the site `field` look). */
export const inputClass = "field";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-text-2">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-text-3">{hint}</span> : null}
    </label>
  );
}

/* ── Tables: bleed to the panel edge, scroll inside, header stays put ── */

/** Scroll container for a table inside a `Panel` (sticky header needs the scroller to own the vertical scroll). */
export function TableScroll({ children, className = "max-h-[70vh]" }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative -mx-5 overflow-auto sm:-mx-6 ${className}`}>{children}</div>;
}

export const tableClass = "w-full border-separate border-spacing-0 text-sm";
export const thClass = "overline sticky top-0 z-10 border-b border-hairline-strong bg-surface px-3 py-2.5 text-left whitespace-nowrap text-text-3 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6";
export const tdClass = "border-b border-hairline px-3 py-3 align-middle first:pl-5 last:pr-5 group-last:border-b-0 sm:first:pl-6 sm:last:pr-6";
export const trClass = "group transition-colors duration-150 hover:bg-text/[0.025]";

export function formatAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} m`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

export const nf = new Intl.NumberFormat("en").format;
