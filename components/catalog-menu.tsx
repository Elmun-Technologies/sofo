"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MegaMenuData, MenuGenre } from "@/lib/queries/mega-menu";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CaptionsIcon,
  ClockIcon,
  FilmIcon,
  GridIcon,
  HeartIcon,
  LayersIcon,
  PlayIcon,
  SparkleIcon,
  TvIcon,
  VolumeIcon,
  XIcon,
} from "./icons";
import { PosterImage } from "./ui/poster-image";
import { ServiceLogo } from "./ui/service-logo";
import { buttonClass } from "./ui/button";

type Service = { slug: string; name: string; logoPath: string | null; href: string };
type Links = { movies: string; series: string; anime: string; kids: string; dubHub: string; subHub: string; newLeaving: string; releases: string; trailers: string; collections: string };

type Section = "movie" | "tv" | "anime" | "kids" | "dub" | "sub" | "platforms" | "new" | "releases" | "trailers" | "collections";

/**
 * santehnika-style "Catalogue" mega-menu: category list with icons on the left, picture tiles on the right.
 * Opens from the orange button; Esc, outside click or navigation closes it.
 */
export function CatalogMenu({ data, links, services, dubLabel, subLabel, lang }: { data: MegaMenuData; links: Links; services: Service[]; dubLabel: string; subLabel: string; lang: string }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("movie");
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const sections: { key: Section; label: string; icon: React.ReactNode; lang?: string }[] = [
    { key: "movie", label: "Movies", icon: <FilmIcon className="size-5" /> },
    { key: "tv", label: "Series", icon: <TvIcon className="size-5" /> },
    { key: "anime", label: "Anime", icon: <SparkleIcon className="size-5" /> },
    { key: "kids", label: "Kids", icon: <HeartIcon className="size-5" /> },
    { key: "dub", label: dubLabel, icon: <VolumeIcon className="size-5 text-dub" />, lang },
    { key: "sub", label: subLabel, icon: <CaptionsIcon className="size-5" />, lang },
    { key: "platforms", label: "Platforms", icon: <LayersIcon className="size-5" /> },
    { key: "new", label: "New & leaving", icon: <ClockIcon className="size-5 text-red-500" /> },
    { key: "releases", label: "Coming to digital", icon: <CalendarIcon className="size-5" /> },
    { key: "trailers", label: "Trailers", icon: <PlayIcon className="size-5" /> },
    { key: "collections", label: "Collections", icon: <GridIcon className="size-5" /> },
  ];

  const genreHref = (base: string, g: MenuGenre) => `${base}?genre=${g.slug}`;
  const tiles = (base: string, genres: MenuGenre[]) => (
    <ul className="grid grid-cols-5 gap-x-4 gap-y-5">
      {genres.slice(0, 10).map((g) => (
        <li key={g.slug}>
          <Link href={genreHref(base, g)} className="group flex items-center gap-3 hover:text-text">
            <span className="w-[46px] shrink-0 transition-transform group-hover:-translate-y-0.5">
              <PosterImage path={g.posterPath} alt="" sizes="46px" className="rounded-[7px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] leading-tight font-semibold group-hover:text-orange-press">{g.name}</span>
              <span className="tnum text-xs text-text-3">{g.count}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
  const also = (items: { href: string; label: string; lang?: string }[]) => (
    <div className="mt-8">
      <h3 className="text-[15px] font-extrabold">Also useful</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} lang={i.lang} className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-[13px] font-semibold hover:bg-surface-2 hover:text-text">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  const commonAlso = [
    { href: `${links.movies}?audio=dub`, label: `Movies · ${dubLabel}`, lang },
    { href: `${links.series}?audio=dub`, label: `Series · ${dubLabel}`, lang },
    { href: `${links.movies}?offer=free`, label: "Free to watch" },
    { href: links.newLeaving, label: "Leaving soon" },
  ];

  const panel: Record<Section, { title: string; href: string; body: React.ReactNode; lang?: string }> = {
    movie: { title: "Movies", href: links.movies, body: <>{tiles(links.movies, data.movie)}{also(commonAlso)}</> },
    tv: { title: "Series", href: links.series, body: <>{tiles(links.series, data.tv)}{also(commonAlso)}</> },
    anime: { title: "Anime", href: links.anime, body: also([{ href: links.anime, label: "All anime" }, { href: `${links.anime}?audio=dub`, label: `Anime · ${dubLabel}`, lang }, { href: `${links.anime}?audio=sub`, label: `Anime · ${subLabel}`, lang }]) },
    kids: { title: "Kids", href: links.kids, body: also([{ href: links.kids, label: "All kids titles" }, { href: `${links.kids}?audio=dub`, label: `Kids · ${dubLabel}`, lang }]) },
    dub: { title: dubLabel, href: links.dubHub, lang, body: also([{ href: links.dubHub, label: `${dubLabel} guide`, lang }, { href: `${links.movies}?audio=dub`, label: "Movies", lang }, { href: `${links.series}?audio=dub`, label: "Series", lang }, { href: `${links.anime}?audio=dub`, label: "Anime", lang }]) },
    sub: { title: subLabel, href: links.subHub, lang, body: also([{ href: links.subHub, label: `${subLabel} guide`, lang }, { href: `${links.movies}?audio=sub`, label: "Movies", lang }, { href: `${links.series}?audio=sub`, label: "Series", lang }]) },
    platforms: {
      title: "Platforms",
      href: links.movies,
      body: (
        <ul className="grid grid-cols-3 gap-3">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={s.href} className="flex items-center gap-3 rounded-card bg-surface p-3 font-semibold hover:bg-surface-2 hover:text-text">
                <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={36} />
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      ),
    },
    new: { title: "New & leaving", href: links.newLeaving, body: also([{ href: links.newLeaving, label: "This week" }, { href: `${links.newLeaving}#leaving`, label: "Leaving soon" }]) },
    releases: { title: "Coming to digital", href: links.releases, body: also([{ href: links.releases, label: "Release tracker" }]) },
    trailers: { title: "Trailers", href: links.trailers, body: also([{ href: links.trailers, label: "All trailers" }]) },
    collections: { title: "Collections", href: links.collections, body: also([{ href: links.collections, label: "Editor collections" }]) },
  };
  const cur = panel[section];

  return (
    <div ref={root} className="max-md:hidden">
      <button type="button" aria-expanded={open} aria-controls="catalog-menu" onClick={() => setOpen((v) => !v)} className={`${buttonClass("accent", "md")} ml-2 !h-12 gap-2 !px-5`}>
        {open ? <XIcon className="size-[18px]" /> : <GridIcon className="size-[18px]" />}
        Catalogue
      </button>
      {open ? (
        <div id="catalog-menu" className="animate-fade-in absolute inset-x-0 top-full z-50 border-t border-hairline bg-ink shadow-pop">
          <div className="wrap grid max-h-[calc(100dvh-140px)] grid-cols-[280px_1fr] gap-8 overflow-y-auto py-6">
            <ul className="border-r border-hairline pr-4">
              {sections.map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setSection(s.key)}
                    onFocus={() => setSection(s.key)}
                    onClick={() => setSection(s.key)}
                    className={`flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-left text-[15px] font-semibold transition-colors ${section === s.key ? "bg-surface text-text" : "text-text-2 hover:text-text"}`}
                  >
                    <span className="text-text-2">{s.icon}</span>
                    <span lang={s.lang}>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="min-w-0 py-1">
              <div className="mb-6 flex items-center gap-4">
                <h2 lang={cur.lang} className="text-[24px] font-extrabold tracking-[-0.02em]">
                  {cur.title}
                </h2>
                <Link href={cur.href} className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-orange-press ring-1 ring-hairline-strong ring-inset hover:bg-surface hover:text-orange-press">
                  See all
                  <ArrowUpRightIcon className="size-3.5" />
                </Link>
              </div>
              {cur.body}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
