"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/qa", label: "Data QA", icon: "⚑" },
  { href: "/admin/lists", label: "Lists", icon: "☰" },
  { href: "/admin/pages", label: "Pages & SEO", icon: "✦" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center gap-3 rounded-button px-3 text-[15px] font-bold whitespace-nowrap transition lg:px-4 ${
              active ? "bg-surface-2 text-text" : "text-text-2 hover:bg-surface hover:text-text"
            }`}
          >
            <span aria-hidden="true" className="w-4 text-center text-xs text-text-3">
              {it.icon}
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
