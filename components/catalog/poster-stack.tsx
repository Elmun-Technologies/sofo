import type { TitleCard } from "@/lib/catalog";
import { PosterImage } from "@/components/ui/poster-image";

/** Three posters on a staggered baseline for hub heroes (decorative, lg+). */
export function PosterStack({ cards }: { cards: TitleCard[] }) {
  if (cards.length === 0) return null;
  const drop = ["mt-14", "mt-0", "mt-24"];
  return (
    <div aria-hidden="true" className="hidden shrink-0 items-start gap-3 lg:flex xl:gap-4">
      {cards.slice(0, 3).map((c, i) => (
        <div key={c.id} className={`w-[136px] xl:w-[168px] ${drop[i]}`}>
          <PosterImage path={c.posterPath} alt="" sizes="168px" />
        </div>
      ))}
    </div>
  );
}
