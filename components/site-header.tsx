import Link from "next/link";
import type { Edition } from "@/lib/editions";
import { dubTerm } from "@/lib/lang";
import { BellIcon, BookmarkIcon, GlobeIcon, SearchIcon } from "./icons";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { HeaderSearch } from "./search/header-search";
import { iconButtonClass } from "./ui/button";

export function SiteHeader({ edition }: { edition: Edition }) {
  const r = edition.routes;
  const dub = dubTerm(edition.contentLang);
  const nav = [
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.anime, label: "Anime" },
    { href: r.kids, label: "Kids" },
    { href: r.dubHub, label: dub.replace(/^./, (c) => c.toLocaleUpperCase(edition.hreflang)), accent: true, localLang: edition.hreflang },
    { href: r.newLeaving, label: "New & leaving" },
    { href: r.trailers, label: "Trailers" },
  ];

  return (
    <header className="glass sticky top-0 z-40 border-b border-hairline">
      <div className="wrap flex h-14 items-center gap-3 md:h-16 md:gap-5">
        <Link href={r.home} aria-label="sofo — home" className="shrink-0 text-[22px] hover:text-text md:text-[24px]">
          <Logo className="" />
        </Link>
        <MainNav items={nav} />
        <div className="hidden min-w-[240px] flex-1 justify-end xl:flex">
          <div className="w-full max-w-[380px]">
            <HeaderSearch action={r.search} />
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 md:gap-1 xl:ml-0">
          <Link href={r.search} aria-label="Search" className={`${iconButtonClass("md")} xl:hidden`}>
            <SearchIcon className="size-5" />
          </Link>
          <Link
            href="/"
            title={`Edition: ${edition.countryName} — change`}
            aria-label={`Edition: ${edition.countryName}. Change edition`}
            className="inline-flex h-11 items-center gap-1.5 rounded-button px-2.5 text-[13px] font-extrabold text-text-2 hover:bg-white/6 hover:text-text"
          >
            <GlobeIcon className="size-[18px]" />
            <span lang="en">{edition.code.toUpperCase()}</span>
          </Link>
          <Link href={`${r.myList}#alerts`} aria-label="Alerts" title="Alerts" className={iconButtonClass("md")}>
            <BellIcon className="size-5" />
          </Link>
          <Link
            href={r.myList}
            className="ml-1 hidden h-10 items-center gap-2 rounded-button bg-white/8 px-3.5 text-[13px] font-extrabold ring-1 ring-hairline ring-inset hover:bg-white/12 hover:text-text md:inline-flex"
          >
            <BookmarkIcon className="size-4" />
            My list
          </Link>
        </div>
      </div>
    </header>
  );
}
