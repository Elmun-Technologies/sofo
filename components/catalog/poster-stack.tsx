import type { TitleCard } from "@/lib/catalog";
import { PosterImage } from "@/components/ui/poster-image";

/** Three tilted posters for hub heroes (decorative). */
export function PosterStack({ cards }: { cards: TitleCard[] }) {
  if (cards.length === 0) return null;
  const tilt = ["-rotate-6 translate-y-4", "rotate-3 -translate-y-2", "rotate-6 translate-y-6"];
  return (
    <div aria-hidden="true" className="hidden shrink-0 items-start gap-3 pr-2 lg:flex">
      {cards.slice(0, 3).map((c, i) => (
        <div key={c.id} className={`w-[130px] shadow-2xl shadow-black/60 xl:w-[140px] ${tilt[i]}`}>
          <PosterImage path={c.posterPath} alt="" sizes="140px" />
        </div>
      ))}
    </div>
  );
}
