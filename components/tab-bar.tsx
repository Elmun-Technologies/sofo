"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EditionRoutes } from "@/lib/editions";
import { BookmarkIcon, ClockIcon, HomeIcon, SearchIcon } from "./icons";

/** Mobile (xs/sm) bottom tab bar: Home, Search, New, My list. */
export function TabBar({ routes }: { routes: EditionRoutes }) {
  const pathname = usePathname();
  const tabs = [
    { href: routes.home, label: "Home", Icon: HomeIcon },
    { href: routes.search, label: "Search", Icon: SearchIcon },
    { href: routes.newLeaving, label: "New", Icon: ClockIcon },
    { href: routes.myList, label: "My list", Icon: BookmarkIcon },
  ];

  return (
    <nav aria-label="Tabs" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-hairline pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors hover:text-text ${active ? "text-text" : "text-text-3"}`}
              >
                <span className={`flex h-7 w-14 items-center justify-center rounded-chip transition-colors duration-200 ${active ? "bg-white text-ink" : ""}`}>
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
