import Link from "next/link";
import type { TitleCard } from "@/lib/catalog";
import { paths, type Edition } from "@/lib/editions";
import { dubTerm } from "@/lib/lang";
import { DubBadge, NewBadge, SubBadge } from "./badges";
import { PosterImage } from "./poster-image";
import { ServiceLogo } from "./service-logo";

type Props = {
  card: TitleCard;
  edition: Edition;
  /** Override the default dub/sub badge */
  badge?: React.ReactNode | "new-dub" | "none";
  /** Second line under the name; defaults to "year · first service" */
  meta?: React.ReactNode;
  rank?: number;
  priority?: boolean;
};

export function PosterCard({ card, edition, badge, meta, rank, priority }: Props) {
  const href = paths.title(edition, card.type, card.slug);
  const defaultBadge = card.dub ? (
    <DubBadge>{dubTerm(edition.contentLang)}</DubBadge>
  ) : card.sub ? (
    <SubBadge />
  ) : null;
  const shownBadge = badge === "none" ? null : badge === "new-dub" ? <NewBadge /> : (badge ?? defaultBadge);
  const metaLine = meta ?? [card.year, card.services[0]?.name].filter(Boolean).join(" · ");

  return (
    <Link href={href} className="group block min-w-0 hover:text-text" aria-label={`${card.name}${card.year ? ` (${card.year})` : ""}`}>
      <div className="relative">
        {rank ? (
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -left-1 z-10 text-[64px] leading-none font-extrabold text-transparent [-webkit-text-stroke:2px_#6E6E7A] md:text-[88px]"
          >
            {rank}
          </span>
        ) : null}
        <PosterImage
          path={card.posterPath}
          alt={card.name}
          priority={priority}
          className="transition duration-200 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-orange"
        />
        {shownBadge ? <span className="absolute top-2 left-2">{shownBadge}</span> : null}
        {card.services[0] ? (
          <span className="absolute right-2 bottom-2 flex gap-1">
            {card.services.slice(0, 2).map((s) => (
              <ServiceLogo key={s.slug} {...s} size={22} className="ring-1 ring-black/40" />
            ))}
          </span>
        ) : null}
      </div>
      <div className="mt-2 truncate text-sm font-bold">{card.name}</div>
      {metaLine ? <div className="truncate text-xs text-text-2">{metaLine}</div> : null}
    </Link>
  );
}
