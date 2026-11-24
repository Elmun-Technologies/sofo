import type { LangState } from "@/lib/short-answer";

// Poster badges are monochrome glass pills with one semantic dot — the artwork stays the loudest thing on the card.
const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-black/65 px-2 py-[3px] text-[10.5px] font-medium leading-[14px] text-white ring-1 ring-inset ring-white/12 backdrop-blur-md";
const dot = "size-1.5 shrink-0 rounded-full";

export function DubBadge({ children = "türkçe dublaj", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={`${base} ${className}`}>
      <span aria-hidden="true" className={`${dot} bg-dub`} />
      {children}
    </span>
  );
}

export function SubBadge({ children = "türkçe altyazı", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={`${base} ${className}`}>
      <span aria-hidden="true" className={`${dot} bg-white/80`} />
      {children}
    </span>
  );
}

export function NewBadge({ children = "New dub", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} !bg-white !text-ink !ring-0 ${className}`}>{children}</span>;
}

export function LeavingBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`${base} ${className}`}>
      <span aria-hidden="true" className={`${dot} bg-leaving`} />
      {children}
    </span>
  );
}

export function FreeBadge({ children = "free", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={`${base} ${className}`}>
      <span aria-hidden="true" className={`${dot} bg-free`} />
      {children}
    </span>
  );
}

export function MutedBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`${base} ${className}`}>{children}</span>;
}

/** Soft tinted status pill (text in the semantic colour on a 14% wash) — for dense UI, not on posters. */
export function Pill({ tone = "muted", children, className = "" }: { tone?: "dub" | "available" | "leaving" | "free" | "orange" | "muted"; children: React.ReactNode; className?: string }) {
  const tones = {
    dub: "text-[#8ab4ff] ring-dub/40",
    available: "text-available ring-available/35",
    leaving: "text-leaving ring-leaving/35",
    free: "text-free ring-free/40",
    orange: "text-orange-hover ring-orange/40",
    muted: "text-text-2 ring-white/14",
  }[tone];
  return <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs leading-4 font-medium whitespace-nowrap ring-1 ring-inset ${tones} ${className}`}>{children}</span>;
}

/** ✓ / — / "not confirmed" — the three language states. Never a guess. */
export function LangMark({ status }: { status: LangState | undefined }) {
  if (status === "confirmed_yes")
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full text-available ring-1 ring-available/40 ring-inset" aria-label="Yes, confirmed by the service">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  if (status === "confirmed_no")
    return (
      <span className="inline-flex size-6 items-center justify-center text-text-3" aria-label="No">
        <span aria-hidden="true" className="h-px w-3 bg-current" />
      </span>
    );
  return (
    <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap text-leaving ring-1 ring-leaving/40 ring-inset" title="Not confirmed by the service">
      not confirmed
    </span>
  );
}
