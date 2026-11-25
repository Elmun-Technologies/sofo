"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlagIcon, GlobeIcon, HomeIcon, ListIcon } from "@/components/icons";

const ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: HomeIcon },
  { href: "/admin/qa", label: "Data QA", Icon: FlagIcon },
  { href: "/admin/lists", label: "Lists", Icon: ListIcon },
  { href: "/admin/pages", label: "Pages & SEO", Icon: GlobeIcon },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center gap-3 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              active ? "bg-white/10 text-text" : "text-text-2 hover:bg-white/5 hover:text-text"
            }`}
          >
            <Icon className={`size-4 shrink-0 ${active ? "text-text" : "text-text-3"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
