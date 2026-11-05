import Link from "next/link";

const cls = (active?: boolean) =>
  `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-chip px-3.5 text-sm font-bold whitespace-nowrap transition ${
    active ? "bg-white text-ink hover:text-ink" : "border border-line bg-surface text-text hover:border-text-3 hover:text-text"
  }`;

export function ChipLink({ href, active, children, scroll }: { href: string; active?: boolean; children: React.ReactNode; scroll?: boolean }) {
  return (
    <Link href={href} scroll={scroll} aria-current={active ? "true" : undefined} className={cls(active)}>
      {children}
    </Link>
  );
}

export function Chip({ active, children, ...rest }: { active?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-pressed={active} className={cls(active)} {...rest}>
      {children}
    </button>
  );
}

export function ChipRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 ${className}`}>{children}</div>;
}
