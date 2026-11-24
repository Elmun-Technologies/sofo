import type { LangState } from "@/lib/short-answer";

const base = "inline-flex items-center gap-1 whitespace-nowrap rounded-[5px] px-1.5 py-[3px] text-[10.5px] font-bold leading-[14px]";

export function DubBadge({ children = "türkçe dublaj", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-dub text-white ${className}`}>{children}</span>;
}

export function SubBadge({ children = "türkçe altyazı", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-white/92 text-ink ${className}`}>{children}</span>;
}

export function NewBadge({ children = "NEW DUB", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-orange text-ink ${className}`}>{children}</span>;
}

export function LeavingBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-leaving text-ink ${className}`}>{children}</span>;
}

export function FreeBadge({ children = "free", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-free text-ink ${className}`}>{children}</span>;
}

export function MutedBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-white/10 text-text ring-1 ring-inset ring-white/10 ${className}`}>{children}</span>;
}

/** Soft tinted status pill (text in the semantic colour on a 14% wash) — for dense UI, not on posters. */
export function Pill({ tone = "muted", children, className = "" }: { tone?: "dub" | "available" | "leaving" | "free" | "orange" | "muted"; children: React.ReactNode; className?: string }) {
  const tones = {
    dub: "bg-dub/15 text-[#8ab4ff] ring-dub/30",
    available: "bg-available/12 text-available ring-available/25",
    leaving: "bg-leaving/12 text-leaving ring-leaving/25",
    free: "bg-free/14 text-free ring-free/30",
    orange: "bg-orange/14 text-orange-hover ring-orange/30",
    muted: "bg-white/6 text-text-2 ring-white/10",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-xs leading-4 font-bold whitespace-nowrap ring-1 ring-inset ${tones} ${className}`}>{children}</span>;
}

/** ✓ / — / "not confirmed" — the three language states. Never a guess. */
export function LangMark({ status }: { status: LangState | undefined }) {
  if (status === "confirmed_yes")
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-available/14 text-available" aria-label="Yes, confirmed by the service">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  if (status === "confirmed_no")
    return (
      <span className="text-text-3" aria-label="No">
        —
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-chip bg-leaving/10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-leaving" title="Not confirmed by the service">
      not confirmed
    </span>
  );
}
