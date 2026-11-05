import Link from "next/link";
import type { Edition } from "@/lib/editions";
import { BellIcon, BookmarkIcon, SearchIcon } from "./icons";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { HeaderSearch } from "./search/header-search";

export function SiteHeader({ edition }: { edition: Edition }) {
  const r = edition.routes;
  const nav = [
    { href: r.home, label: "Home" },
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.anime, label: "Anime" },
    { href: r.kids, label: "Kids" },
    { href: r.newLeaving, label: "New & leaving" },
    { href: r.trailers, label: "Trailers" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-ink/92 backdrop-blur">
      <div className="mx-auto flex max-w-site items-center gap-x-5 px-4 py-3 md:px-7">
        <Link href={r.home} aria-label="sofo — home" className="shrink-0 text-[22px] md:text-[24px]">
          <Logo className="" />
        </Link>
        <MainNav items={nav} />
        <div className="hidden min-w-[220px] flex-1 lg:flex">
          <HeaderSearch action={r.search} />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <Link
            href={r.search}
            aria-label="Search"
            className="hidden size-11 items-center justify-center rounded-button bg-surface md:inline-flex lg:hidden"
          >
            <SearchIcon className="size-[18px]" />
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-button bg-surface px-3 text-[13px] font-bold md:h-11 md:text-sm"
            title="Change edition"
          >
            <span className="xl:hidden">{edition.switcherLabel}</span>
            <span className="hidden xl:inline">{edition.countryName} · EN</span>
          </Link>
          <Link
            href={`${r.myList}#alerts`}
            aria-label="Notifications"
            className="relative inline-flex size-9 items-center justify-center rounded-button bg-surface md:size-11"
          >
            <BellIcon className="size-[18px]" />
          </Link>
          <Link
            href={r.myList}
            className="hidden h-11 items-center gap-2 rounded-button bg-surface px-3.5 text-sm font-bold md:inline-flex"
          >
            <BookmarkIcon className="size-4" />
            My list
          </Link>
        </div>
      </div>
    </header>
  );
}
