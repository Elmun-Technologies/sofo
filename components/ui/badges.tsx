import type { LangState } from "@/lib/short-answer";

const base = "inline-flex items-center whitespace-nowrap rounded-chip px-2 py-0.5 text-[11px] font-extrabold leading-4";

export function DubBadge({ children = "türkçe dublaj", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-dub text-white ${className}`}>{children}</span>;
}

export function SubBadge({ children = "türkçe altyazı", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <span className={`${base} bg-white text-ink ${className}`}>{children}</span>;
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
  return <span className={`${base} bg-surface-2 text-text ${className}`}>{children}</span>;
}

/** ✓ / — / "not confirmed" — the three language states. Never a guess. */
export function LangMark({ status }: { status: LangState | undefined }) {
  if (status === "confirmed_yes")
    return (
      <span className="text-available" aria-label="Yes, confirmed by the service">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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
    <span className="text-[11px] font-semibold whitespace-nowrap text-leaving" title="Not confirmed by the service">
      not confirmed
    </span>
  );
}
