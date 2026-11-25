import Link from "next/link";
import type { TitleCard } from "@/lib/catalog";
import type { Edition } from "@/lib/editions";
import { PosterCard } from "@/components/ui/poster-card";
import { Rail } from "@/components/ui/rail";

/**
 * santehnika "campaign" block: a dark panel with a pitch on the left and white mini product cards on the
 * right. Used for the weekly Top 10 so the home page gets one cinema-dark accent.
 */
export function DarkShelf({ title, sub, cta, href, cards, edition, ranked }: { title: string; sub: string; cta: string; href: string; cards: TitleCard[]; edition: Edition; ranked?: boolean }) {
  if (cards.length === 0) return null;
  return (
    <section className="wrap section-y">
      <div className="relative overflow-hidden rounded-hero bg-[#0f1013] p-4 text-white md:grid md:grid-cols-[260px_1fr] md:items-center md:gap-6 md:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-orange/25 blur-3xl" />
        <div className="relative mb-4 md:mb-0 md:pl-2">
          <p lang="en" className="overline text-orange">
            This week
          </p>
          <h2 className="mt-2 text-[26px] leading-tight font-extrabold tracking-[-0.03em] md:text-[30px]">{title}</h2>
          <p className="mt-2 text-sm text-white/65">{sub}</p>
          <Link href={href} className="mt-5 inline-flex h-11 items-center justify-center rounded-button bg-orange px-5 text-sm font-bold text-text hover:bg-orange-hover hover:text-text max-md:hidden">
            {cta}
          </Link>
        </div>
        <Rail className="relative gap-2.5 md:gap-3">
          {cards.map((c, i) => (
            <li key={c.id} className="w-[38%] shrink-0 snap-start rounded-[14px] bg-ink p-2 text-text sm:w-[27%] md:w-[23%] lg:w-[18.6%]">
              <PosterCard card={c} edition={edition} rank={ranked ? i + 1 : undefined} priority={i < 3} />
            </li>
          ))}
        </Rail>
      </div>
    </section>
  );
}
