import Link from "next/link";
import { ArrowLeftIcon, SearchIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip";
import { EDITIONS, editionCodes } from "@/lib/editions";

// not-found.tsx receives no params; only the TR edition is live, so its routes are used.
const edition = EDITIONS[editionCodes()[0] ?? "tr"]!;

export default function NotFound() {
  return <NotFoundContent />;
}

export function NotFoundContent() {
  const r = edition.routes;
  const popular: { href: string; label: string; local?: boolean }[] = [
    { href: r.dubHub, label: "Türkçe dublaj", local: true },
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.newLeaving, label: "New & leaving" },
    { href: r.kids, label: "Kids" },
    { href: r.myList, label: "My list" },
  ];
  return (
    <section className="wrap relative overflow-hidden py-14 md:py-28">
      <p aria-hidden="true" className="tnum pointer-events-none absolute top-6 right-4 text-[clamp(7rem,30vw,22rem)] leading-[0.8] font-normal tracking-[-0.07em] text-white/[0.05] select-none md:top-16 md:right-7">
        404
      </p>
      <div className="relative max-w-2xl">
        <p lang="en" className="overline text-text-3">
          Error 404
        </p>
        <h1 className="text-display mt-4">
          This page left <span className="text-text-3">the catalog.</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-text-2 md:text-lg">Titles move between services. Search again — we probably know where it went.</p>

        <form
          role="search"
          action={r.search}
          className="mt-8 flex h-14 max-w-lg items-center gap-3 rounded-full border border-hairline-strong bg-surface pr-1.5 pl-5 transition duration-200 ease-out focus-within:border-white/60 focus-within:shadow-[0_0_0_4px_rgb(255_255_255/0.08)] hover:border-white/25 md:mt-10"
        >
          <SearchIcon className="size-5 shrink-0 text-text-2" />
          <label htmlFor="nf-q" className="sr-only">
            Search a title
          </label>
          <input
            id="nf-q"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search a title…"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-text-3 [&::-webkit-search-cancel-button]:hidden"
          />
          <button type="submit" className={buttonClass("primary", "md")}>
            Search
          </button>
        </form>
      </div>

      <div className="relative mt-14 md:mt-24">
        <div className="rule" />
        <div className="flex flex-col gap-5 pt-6 md:flex-row md:items-center md:gap-8">
          <p lang="en" className="overline shrink-0 text-text-3">
            Popular on sofo
          </p>
          <ul className="flex flex-wrap gap-2">
            {popular.map((p) => (
              <li key={p.href}>
                <ChipLink href={p.href}>
                  <span lang={p.local ? edition.hreflang : undefined}>{p.label}</span>
                </ChipLink>
              </li>
            ))}
          </ul>
          <Link href={r.home} className="inline-flex items-center gap-2 text-sm font-medium text-text-2 md:ml-auto">
            <ArrowLeftIcon className="size-4" />
            Back to sofo {edition.countryName}
          </Link>
        </div>
      </div>
    </section>
  );
}
