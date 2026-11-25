import Link from "next/link";
import { paths, type Edition } from "@/lib/editions";
import type { MegaMenuData } from "@/lib/queries/mega-menu";
import { CatalogMenu } from "./catalog-menu";
import { dubTerm, subTerm } from "@/lib/lang";
import { BellIcon, BookmarkIcon, PinIcon, SearchIcon, ShieldCheckIcon } from "./icons";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { HeaderSearch } from "./search/header-search";

/**
 * DS4 "Sofo Market" header (santehnika-online structure): utility strip → main bar (logo, Catalogue,
 * search, icon actions) → category row. Only the main bar and category row stick.
 */
const EMPTY_MENU: MegaMenuData = { movie: [], tv: [], total: { movie: 0, tv: 0 } };

export function SiteHeader({ edition, menu = EMPTY_MENU, services = [] }: { edition: Edition; menu?: MegaMenuData; services?: { slug: string; name: string; logoPath: string | null }[] }) {
  const r = edition.routes;
  const cap = (s: string) => s.replace(/^./, (c) => c.toLocaleUpperCase(edition.hreflang));
  const nav = [
    { href: r.newLeaving, label: "New & leaving", dot: "bg-red-500" },
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.anime, label: "Anime" },
    { href: r.kids, label: "Kids" },
    { href: r.dubHub, label: cap(dubTerm(edition.contentLang)), dot: "bg-dub", localLang: edition.hreflang },
    { href: r.subHub, label: cap(subTerm(edition.contentLang)), localLang: edition.hreflang },
    { href: r.releases, label: "Coming to digital" },
    { href: r.trailers, label: "Trailers" },
  ];
  const serviceCount = edition.coreServices.length;

  return (
    <>
      <div className="hidden bg-ink-2 text-[13px] text-text-2 md:block">
        <div className="wrap flex h-9 items-center gap-5">
          <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-text hover:text-orange-press" title="Change edition">
            <PinIcon className="size-4 text-orange" />
            {edition.countryName}
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4 text-available" />
            {serviceCount} legal services · checked daily
          </span>
          <span className="ml-auto flex items-center gap-5">
            <Link href={r.about} className="hover:text-text">
              How it works
            </Link>
            <Link href={`${r.about}#partners`} className="hover:text-text">
              For streaming services
            </Link>
            <Link href={`${r.myList}#alerts`} className="inline-flex items-center gap-1.5 hover:text-text">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
              Telegram alerts
            </Link>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur-xl">
        {/* CatalogMenu panel is positioned against this header (absolute, top-full). */}
        <div className="wrap flex h-16 items-center gap-3 md:h-[76px] md:gap-4">
          <Link href={r.home} aria-label="sofo — home" className="shrink-0 text-[24px] hover:text-text md:text-[28px]">
            <Logo className="" />
          </Link>
          <CatalogMenu
            data={menu}
            links={{ movies: r.movies, series: r.series, anime: r.anime, kids: r.kids, dubHub: r.dubHub, subHub: r.subHub, newLeaving: r.newLeaving, releases: r.releases, trailers: r.trailers, collections: r.collections }}
            services={services.map((s) => ({ ...s, href: paths.service(edition, s.slug) }))}
            dubLabel={cap(dubTerm(edition.contentLang))}
            subLabel={cap(subTerm(edition.contentLang))}
            lang={edition.hreflang}
          />
          <div className="hidden min-w-0 flex-1 md:block">
            <HeaderSearch action={r.search} />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-2 md:gap-2">
            <Link href={r.search} aria-label="Search" className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-text hover:bg-surface-2 md:hidden">
              <SearchIcon className="size-5" />
            </Link>
            <HeaderAction href={`${r.myList}#alerts`} label="Alerts" icon={<BellIcon className="size-[21px]" />} />
            <HeaderAction href={r.myList} label="My list" icon={<BookmarkIcon className="size-[21px]" />} />
          </div>
        </div>
        <div className="hidden border-t border-hairline md:block">
          <div className="wrap">
            <MainNav items={nav} />
          </div>
        </div>
      </header>
    </>
  );
}

function HeaderAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="group flex flex-col items-center gap-0.5 px-1.5 text-text-2 hover:text-text md:min-w-[64px]">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-surface transition-colors group-hover:bg-surface-2 md:size-10">{icon}</span>
      <span className="hidden text-[11px] leading-none font-semibold md:block">{label}</span>
    </Link>
  );
}
