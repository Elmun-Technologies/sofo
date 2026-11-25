import Link from "next/link";
import { PosterImage } from "@/components/ui/poster-image";
import { SectionHeader } from "@/components/ui/section-header";
import type { TitleCard } from "@/lib/catalog";
import { paths, type Edition } from "@/lib/editions";
import { daysUntil, formatDate } from "@/lib/format";

type Item = { leavingAt: Date; card: TitleCard };

const day = (d: Date) => formatDate(d, { day: "numeric", month: "short" });

/** "Leaving soon": one compact row per title with its last day — reads the same with one title or six. */
export function ServiceLeaving({ edition: e, serviceName, items }: { edition: Edition; serviceName: string; items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <section className="wrap py-6 md:py-10" aria-labelledby="leaving-title">
      <div className="rule mb-6 md:mb-8" />
      <SectionHeader id="leaving-title" title="Leaving soon" sub={`From ${serviceName} in ${e.countryName} — watch before it goes`} href={e.routes.newLeaving} linkLabel="All leaving" />
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
        {items.slice(0, 6).map(({ card, leavingAt }) => {
          const left = Math.max(0, daysUntil(leavingAt));
          return (
            <li key={card.id}>
              <Link href={paths.title(e, card.type, card.slug)} className="card card-hover flex items-center gap-4 p-3 pr-5 md:p-3.5 md:pr-6">
                <span className="w-[60px] shrink-0 md:w-[68px]">
                  <PosterImage path={card.posterPath} alt="" sizes="68px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold md:text-base">{card.name}</span>
                  <span className="tnum mt-1 flex items-center gap-2 text-[13px] text-text-2">
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-leaving" />
                    <span className="truncate">
                      Leaves {serviceName} {day(leavingAt)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[32px] leading-[0.9] font-normal tracking-[-0.05em] text-leaving md:text-[40px]">{left}</span>
                  <span className="mt-1 block text-[11px] text-text-3">{left === 1 ? "day left" : "days left"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
