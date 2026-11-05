import type { EventType, ReportStatus } from "@prisma/client";

export function AdminHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[28px] font-extrabold tracking-tight">{title}</h1>
      {right ? <div className="text-sm text-text-2">{right}</div> : null}
    </div>
  );
}

export function Panel({ title, children, className = "", right }: { title?: string; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <section className={`min-w-0 rounded-panel border border-line bg-surface p-4 sm:p-5 ${className}`}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs font-extrabold tracking-[0.12em] text-text-3 uppercase">{title}</h2>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, tone = "default" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" }) {
  const color = { default: "text-text", good: "text-available", warn: "text-leaving", bad: "text-red-400" }[tone];
  return (
    <div className="rounded-panel border border-line bg-surface p-5">
      <div className="text-[13px] font-bold text-text-2">{label}</div>
      <div className={`mt-2 text-[32px] leading-none font-extrabold tracking-tight tabular-nums ${color}`}>{value}</div>
      {sub ? <div className="mt-2 text-xs text-text-3">{sub}</div> : null}
    </div>
  );
}

const EVENT_TONE: Partial<Record<EventType, string>> = {
  added: "bg-orange text-ink",
  audio_added: "bg-dub text-white",
  subtitle_added: "bg-dub/70 text-white",
  leaving_announced: "bg-leaving text-ink",
  price_change: "bg-free text-ink",
};

export function EventPill({ type }: { type: EventType }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center rounded-chip px-2.5 text-[11px] font-extrabold ${EVENT_TONE[type] ?? "bg-line text-text"}`}>
      {type === "leaving_announced" ? "leaving" : type}
    </span>
  );
}

const STATUS_TONE: Record<ReportStatus, string> = {
  open: "bg-leaving text-ink",
  rechecking: "bg-dub text-white",
  fixed: "bg-available/15 text-available",
  rejected: "bg-line text-text-2",
};

export function StatusPill({ status }: { status: ReportStatus }) {
  return <span className={`inline-flex h-6 items-center rounded-chip px-2.5 text-[11px] font-extrabold ${STATUS_TONE[status]}`}>{status}</span>;
}

export function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "dub" }) {
  const t = { default: "bg-line text-text-2", good: "bg-available/15 text-available", warn: "bg-leaving/15 text-leaving", dub: "bg-dub/20 text-[#93c5fd]" }[tone];
  return <span className={`inline-flex h-6 items-center rounded-chip px-2.5 text-[11px] font-extrabold whitespace-nowrap ${t}`}>{children}</span>;
}

export const inputClass =
  "h-11 w-full rounded-input border border-line bg-ink px-3.5 text-[15px] text-text placeholder:text-text-3 focus:border-orange focus:outline-none";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-text-2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-text-3">{hint}</span> : null}
    </label>
  );
}

export function formatAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} m`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

export const nf = new Intl.NumberFormat("en").format;
