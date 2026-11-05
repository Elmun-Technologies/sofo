import type { TitleCard } from "@/lib/catalog";
import type { Edition } from "@/lib/editions";
import { PosterCard } from "./poster-card";
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

/** Horizontal poster carousel (scroll-snap); 3 visible on xs up to 7 on xl. */
export function PosterRow({ title, cards, edition, href, sub, badge, meta, ranked }: Props) {
  if (cards.length === 0) return null;
  return (
    <section className="mx-auto max-w-site px-4 py-5 md:px-7 md:py-7">
      <SectionHeader title={title} href={href} sub={sub} linkLabel="All" />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:-mx-7 md:gap-4 md:px-7">
        {cards.map((c, i) => (
          <li
            key={c.id}
            className={`shrink-0 snap-start ${ranked ? "w-[44%] pl-6 sm:w-[30%] md:w-[24%] md:pl-10 lg:w-[19%] xl:w-[17%]" : "w-[30%] sm:w-[23%] md:w-[18.5%] lg:w-[15.5%] xl:w-[13.4%]"}`}
          >
            <PosterCard card={c} edition={edition} badge={badge?.(c)} meta={meta?.(c)} rank={ranked ? i + 1 : undefined} priority={i < 3} />
          </li>
        ))}
      </ul>
    </section>
  );
}
