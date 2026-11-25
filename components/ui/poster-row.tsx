import type { TitleCard } from "@/lib/catalog";
import type { Edition } from "@/lib/editions";
import { PosterCard } from "./poster-card";
import { Rail } from "./rail";
import { SectionHeader } from "./section-header";

type Props = {
  title: React.ReactNode;
  cards: TitleCard[];
  edition: Edition;
  href?: string;
  sub?: React.ReactNode;
  badge?: (c: TitleCard) => React.ReactNode | "new-dub" | "none" | undefined;
  meta?: (c: TitleCard) => React.ReactNode;
  ranked?: boolean;
};

/** Poster widths: 3 visible (+ a peek) on xs up to 7 on xl — DS "Responsive" board. */
export const RAIL_ITEM = "w-[31%] sm:w-[23.4%] md:w-[18.6%] lg:w-[15.4%] xl:w-[13.1%]";

/** Horizontal poster carousel (scroll-snap + paging arrows). */
export function PosterRow({ title, cards, edition, href, sub, badge, meta, ranked }: Props) {
  if (cards.length === 0) return null;
  return (
    <section className="wrap section-y">
      <SectionHeader title={title} href={href} sub={sub} linkLabel="See all" />
      <Rail className="gap-3 pb-2 md:gap-4">
        {cards.map((c, i) => (
          <li key={c.id} className={`shrink-0 snap-start ${RAIL_ITEM}`}>
            <PosterCard card={c} edition={edition} badge={badge?.(c)} meta={meta?.(c)} rank={ranked ? i + 1 : undefined} priority={i < 3} />
          </li>
        ))}
      </Rail>
    </section>
  );
}
