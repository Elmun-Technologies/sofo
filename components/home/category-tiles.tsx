import Link from "next/link";
import type { TitleCard } from "@/lib/catalog";
import { ArrowUpRightIcon } from "@/components/icons";
import { PosterImage } from "@/components/ui/poster-image";

export type CategoryTile = { href: string; label: string; count?: number; cards: TitleCard[]; lang?: string; dot?: string };

/** santehnika-style category tiles: soft grey card, label top-left, a fanned poster stack bottom-right. */
export function CategoryTiles({ tiles, allHref }: { tiles: CategoryTile[]; allHref: string }) {
  return (
    <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0 xl:grid-cols-10">
      {tiles.map((t) => (
        <li key={t.href} className="shrink-0">
          <Link
            href={t.href}
            className="group relative flex h-[132px] w-[128px] flex-col overflow-hidden rounded-card bg-surface p-3.5 transition-colors hover:bg-surface-2 hover:text-text md:h-[150px] md:w-auto"
          >
            <span lang={t.lang} className="relative z-10 flex items-start gap-1.5 text-[14px] leading-tight font-bold">
              {t.dot ? <span aria-hidden="true" className={`mt-[5px] size-1.5 shrink-0 rounded-full ${t.dot}`} /> : null}
              {t.label}
            </span>
            <span aria-hidden="true" className="absolute -right-2 -bottom-5 flex">
              {t.cards.slice(0, 3).map((c, i) => (
                <span
                  key={c.id}
                  className="-ml-7 block w-[50px] transition duration-300 ease-out first:ml-0 group-hover:-translate-y-1.5 md:w-[56px]"
                  style={{ zIndex: i === 1 ? 3 : 2 - i, rotate: `${(i - 1) * 7}deg`, transitionDelay: `${i * 30}ms` }}
                >
                  <PosterImage path={c.posterPath} alt="" sizes="56px" className="rounded-[7px] shadow-poster" />
                </span>
              ))}
            </span>
          </Link>
        </li>
      ))}
      <li className="shrink-0">
        <Link href={allHref} className="flex h-[132px] w-[128px] flex-col justify-between rounded-card bg-surface p-3.5 text-[14px] font-bold transition-colors hover:bg-surface-2 hover:text-text md:h-[150px] md:w-auto">
          See all
          <span className="inline-flex size-9 items-center justify-center self-end rounded-full bg-ink text-text">
            <ArrowUpRightIcon className="size-4" />
          </span>
        </Link>
      </li>
    </ul>
  );
}
