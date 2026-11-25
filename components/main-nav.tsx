"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; dot?: string; localLang?: string };

/** Category row under the main bar (santehnika-style): compact links, the current one underlined in orange. */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="no-scrollbar -mx-2 flex h-11 items-stretch overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            lang={item.localLang}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex shrink-0 items-center gap-1.5 px-2.5 text-[14px] font-semibold whitespace-nowrap transition-colors hover:text-orange-press lg:px-3 ${
              active ? "text-text" : "text-text-2"
            } after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange after:transition-transform after:duration-200 lg:after:inset-x-3 ${
              active ? "after:scale-x-100" : "after:scale-x-0"
            }`}
          >
            {item.dot ? <span aria-hidden="true" className={`size-1.5 rounded-full ${item.dot}`} /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
