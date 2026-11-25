import Link from "next/link";

const cls = (active?: boolean) =>
  `inline-flex h-9 shrink-0 items-center gap-2 rounded-chip px-4 text-[13px] font-medium whitespace-nowrap select-none transition duration-200 ease-out active:scale-[0.97] ${
    active ? "bg-text text-ink hover:text-ink" : "text-text-2 ring-1 ring-inset ring-hairline-strong hover:bg-text/6 hover:text-text hover:ring-text/30"
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

/** One line of chips: swipeable to the screen edge on phones, wraps from md. */
export function ChipRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 md:mx-0 md:flex-wrap md:px-0 ${className}`}>{children}</div>;
}
