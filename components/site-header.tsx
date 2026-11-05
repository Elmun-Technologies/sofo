import Link from "next/link";
import type { Edition } from "@/lib/editions";
import { BellIcon, BookmarkIcon, SearchIcon } from "./icons";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";

export function SiteHeader({ edition }: { edition: Edition }) {
  const r = edition.routes;
  const nav = [
    { href: r.home, label: "Home" },
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.anime, label: "Anime" },
    { href: r.kids, label: "Kids" },
    { href: r.collections, label: "Collections" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-ink/92 backdrop-blur">
      <div className="mx-auto flex max-w-site items-center gap-x-6 gap-y-2.5 px-4 py-3 md:px-7 md:py-3.5">
        <Link href={r.home} aria-label="sofo — home" className="text-[22px] md:text-[26px]">
          <Logo className="" />
        </Link>
        <MainNav items={nav} />
        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href={r.search}
            className="hidden h-11 items-center gap-2.5 rounded-input border border-line bg-surface px-3.5 text-sm font-semibold text-text-2 md:inline-flex"
          >
            <SearchIcon className="size-4" />
            Search
            <kbd className="rounded-[5px] bg-line px-1.5 py-0.5 font-ui text-xs">/</kbd>
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-button bg-surface px-3 text-[13px] font-bold md:h-11 md:text-sm"
          >
            <span className="md:hidden">{edition.switcherLabel}</span>
            <span className="hidden md:inline">{edition.countryName} · EN</span>
          </Link>
          <Link
            href={r.myList}
            className="hidden h-11 items-center gap-2 rounded-button bg-surface px-3.5 text-sm font-bold md:inline-flex"
          >
            <BookmarkIcon className="size-4" />
            My list
          </Link>
          <Link
            href={r.myList}
            aria-label="Notifications"
            className="inline-flex size-9 items-center justify-center rounded-button bg-surface md:hidden"
          >
            <BellIcon className="size-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
