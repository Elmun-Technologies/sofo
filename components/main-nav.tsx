"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Desktop primary nav; highlights the current section. */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden grow flex-wrap gap-0.5 text-[15px] font-bold md:flex">
      {items.map((item) => {
        const active = item.href.split("?")[0] === pathname && !item.href.includes("?");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`px-2 py-3 ${active ? "text-text" : "text-text-2"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
