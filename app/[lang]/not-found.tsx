import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { EDITIONS, editionCodes } from "@/lib/editions";

// not-found.tsx receives no params; only the TR edition is live, so its routes are used.
const edition = EDITIONS[editionCodes()[0] ?? "tr"]!;

export default function NotFound() {
  return <NotFoundContent />;
}

export function NotFoundContent() {
  const r = edition.routes;
  const popular = [
    { href: r.dubHub, label: "Türkçe dublaj" },
    { href: r.movies, label: "Movies" },
    { href: r.series, label: "Series" },
    { href: r.newLeaving, label: "New & leaving" },
    { href: r.kids, label: "Kids" },
    { href: r.myList, label: "My list" },
  ];
  return (
    <section className="mx-auto max-w-site px-4 py-10 md:px-7 md:py-16">
      <div className="mx-auto max-w-2xl rounded-panel border border-line bg-surface px-5 py-10 text-center md:px-10 md:py-14">
        <p lang="en" className="text-xs font-extrabold tracking-[0.12em] text-text-3 uppercase">Error 404</p>
        <p aria-hidden="true" className="mt-2 text-[88px] leading-none font-extrabold tracking-[-0.04em] text-line md:text-[120px]">
          404
        </p>
        <h1 className="mt-3 text-2xl font-extrabold md:text-[28px]">This page left the catalog</h1>
        <p className="mx-auto mt-2 max-w-md text-text-2">Titles move between services. Search again — we probably know where it went.</p>

        <form role="search" action={r.search} className="mx-auto mt-6 flex h-12 max-w-md items-center gap-2.5 rounded-input border border-line bg-ink px-4 focus-within:border-orange">
          <SearchIcon className="size-[18px] shrink-0 text-orange" />
          <label htmlFor="nf-q" className="sr-only">
            Search a title
          </label>
          <input id="nf-q" name="q" type="search" autoComplete="off" placeholder="Search a title…" className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-text-3" />
          <button type="submit" className="text-sm font-extrabold text-orange hover:text-orange-tint">
            Search
          </button>
        </form>

        <p className="mt-8 text-sm font-bold">Popular on sofo</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {popular.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="inline-flex h-9 items-center rounded-chip border border-line bg-ink px-3.5 text-sm font-bold text-text hover:border-text-3 hover:text-text">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={r.home} className="mt-8 inline-block text-sm font-bold text-text-2">
          ← Back to sofo {edition.countryName}
        </Link>
      </div>
    </section>
  );
}
