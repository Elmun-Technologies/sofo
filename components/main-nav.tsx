"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Desktop primary nav; highlights the current section. */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden min-w-0 gap-0.5 overflow-x-auto text-[15px] font-bold [scrollbar-width:none] md:flex">
      {items.map((item, i) => {
        // Home only matches exactly; sections match their prefix.
        const active = i === 0 ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 px-2 py-3 whitespace-nowrap ${active ? "text-text" : "text-text-2"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
