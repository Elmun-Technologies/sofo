"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; accent?: boolean; localLang?: string };

/** Desktop primary nav; the current section gets full-strength text and an orange underline. */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="no-scrollbar hidden h-full min-w-0 items-stretch overflow-x-auto md:flex lg:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            lang={item.localLang}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex shrink-0 items-center gap-1.5 px-2.5 text-sm font-bold whitespace-nowrap transition-colors hover:text-text lg:px-3 ${
              active ? "text-text" : "text-text-2"
            } after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-orange after:transition-transform after:duration-200 lg:after:inset-x-3 ${
              active ? "after:scale-x-100" : "after:scale-x-0"
            }`}
          >
            {item.accent ? <span aria-hidden="true" className="size-1.5 rounded-full bg-dub shadow-[0_0_8px_var(--color-dub)]" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
