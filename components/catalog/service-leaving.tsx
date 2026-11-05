import Link from "next/link";
import { LeavingBadge } from "@/components/ui/badges";
import { PosterCard } from "@/components/ui/poster-card";
import { PosterImage } from "@/components/ui/poster-image";
import type { TitleCard } from "@/lib/catalog";
import { paths, type Edition } from "@/lib/editions";
import { formatDate } from "@/lib/format";

type Item = { leavingAt: Date; card: TitleCard };

const day = (d: Date) => formatDate(d, { day: "numeric", month: "short" });

/** "Leaving soon" — amber panel with posters (desktop) / list (mobile). */
export function ServiceLeaving({ edition: e, serviceName, items }: { edition: Edition; serviceName: string; items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-site px-4 py-5 md:px-7 md:py-7" aria-labelledby="leaving-title">
      <div className="md:rounded-panel md:border md:border-leaving/25 md:bg-[linear-gradient(180deg,#1f1a0e_0%,#15140f_100%)] md:p-6">
        <div className="mb-3.5 flex items-baseline gap-3 md:mb-4">
          <h2 id="leaving-title" className="text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
            Leaving soon
          </h2>
          <span className="hidden text-sm text-text-2 sm:inline">
            From {serviceName} in {e.countryName} — watch before it goes
          </span>
          <Link href={e.routes.newLeaving} className="ml-auto shrink-0 text-sm font-bold text-text-2">
            All leaving →
          </Link>
        </div>
        <ul className="hidden grid-cols-5 gap-4 md:grid lg:grid-cols-6">
          {items.slice(0, 6).map(({ card, leavingAt }, i) => (
            <li key={card.id} className={i === 5 ? "hidden lg:block" : undefined}>
              <PosterCard
                card={card}
                edition={e}
                badge={<LeavingBadge>LEAVING {day(leavingAt).toUpperCase()}</LeavingBadge>}
                meta={`Leaves ${serviceName} ${day(leavingAt)}`}
              />
            </li>
          ))}
        </ul>
        <ul className="space-y-2.5 md:hidden">
          {items.slice(0, 5).map(({ card, leavingAt }) => (
            <li key={card.id}>
              <Link href={paths.title(e, card.type, card.slug)} className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-2.5 hover:text-text">
                <span className="w-14 shrink-0">
                  <PosterImage path={card.posterPath} alt="" sizes="56px" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-extrabold">{card.name}</span>
                  <span className="block text-[13px] text-text-2">
                    Leaves {serviceName} {day(leavingAt)}
                  </span>
                  <LeavingBadge className="mt-1.5">LEAVING {day(leavingAt).toUpperCase()}</LeavingBadge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
