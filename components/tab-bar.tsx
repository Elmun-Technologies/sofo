"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EditionRoutes } from "@/lib/editions";
import { BookmarkIcon, ClockIcon, GridIcon, HomeIcon, SearchIcon } from "./icons";

/** Mobile (xs/sm) bottom tab bar: Home, Catalogue, Search, New, My list. */
export function TabBar({ routes }: { routes: EditionRoutes }) {
  const pathname = usePathname();
  const tabs = [
    { href: routes.home, label: "Home", Icon: HomeIcon },
    { href: routes.catalog, label: "Catalogue", Icon: GridIcon },
    { href: routes.search, label: "Search", Icon: SearchIcon },
    { href: routes.newLeaving, label: "New", Icon: ClockIcon },
    { href: routes.myList, label: "My list", Icon: BookmarkIcon },
  ];

  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-ink shadow-[0_-8px_24px_-12px_rgb(16_24_40/0.15)] pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors hover:text-text ${active ? "text-text" : "text-text-3"}`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-chip transition-colors duration-200 ${active ? "bg-text text-ink" : ""}`}>
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
