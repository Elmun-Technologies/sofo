import type { TitleCard } from "@/lib/catalog";
import type { Edition } from "@/lib/editions";
import { PosterCard } from "./poster-card";

type Props = {
  cards: TitleCard[];
  edition: Edition;
  badge?: (c: TitleCard) => React.ReactNode | "new-dub" | "none" | undefined;
  meta?: (c: TitleCard) => React.ReactNode;
  /** Narrower grid when placed next to a sidebar */
  dense?: boolean;
};

/** Responsive poster grid: 3 (xs) · 4 (sm) · 5 (md) · 6 (lg) · 7 (xl). */
export function PosterGrid({ cards, edition, badge, meta, dense }: Props) {
  return (
    <ul
      className={`grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 md:gap-x-4 ${dense ? "lg:grid-cols-5" : "lg:grid-cols-6 xl:grid-cols-7"}`}
    >
      {cards.map((c, i) => (
        <li key={c.id}>
          <PosterCard card={c} edition={edition} badge={badge?.(c)} meta={meta?.(c)} priority={i < 6} />
        </li>
      ))}
    </ul>
  );
}
