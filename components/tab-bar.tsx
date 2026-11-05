"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EditionRoutes } from "@/lib/editions";
import { ClockIcon, HeartIcon, HomeIcon, SearchIcon } from "./icons";

/** Mobile (xs/sm) bottom tab bar: Home, Search, New, My list. */
export function TabBar({ routes }: { routes: EditionRoutes }) {
  const pathname = usePathname();
  const tabs = [
    { href: routes.home, label: "Home", Icon: HomeIcon },
    { href: routes.search, label: "Search", Icon: SearchIcon },
    { href: routes.newLeaving, label: "New", Icon: ClockIcon },
    { href: routes.myList, label: "My list", Icon: HeartIcon },
  ];

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-bold ${active ? "text-orange" : "text-text-2"}`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
