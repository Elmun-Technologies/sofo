import Link from "next/link";
import type { TitleCard } from "@/lib/catalog";
import { paths, type Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import { StarIcon } from "../icons";
import { DubBadge, NewBadge, SubBadge } from "./badges";
import { PosterImage } from "./poster-image";
import { QuickSave } from "./quick-save";
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
  sizes?: string;
};

/**
 * Poster tile. Resting state stays quiet (art, one language badge, service logos) with the score in the
 * meta line; hover on pointer devices reveals the facts: score, year, genres and confirmed languages.
 */
export function PosterCard({ card, edition, badge, meta, rank, priority, sizes }: Props) {
  const href = paths.title(edition, card.type, card.slug);
  const lang = edition.contentLang;
  const defaultBadge = card.dub ? <DubBadge>{dubTerm(lang)}</DubBadge> : card.sub ? <SubBadge>{subTerm(lang)}</SubBadge> : null;
  const shownBadge = badge === "none" ? null : badge === "new-dub" ? <NewBadge /> : (badge ?? defaultBadge);
  const metaLine = meta ?? [card.services[0]?.name, card.year].filter(Boolean).join(" · ");
  const extra = card.services.length - 2;

  return (
    <div className="group relative min-w-0">
      <Link href={href} className="block rounded-poster hover:text-text" aria-label={`${card.name}${card.year ? ` (${card.year})` : ""}`}>
        <div className="relative overflow-hidden rounded-poster">
          <PosterImage path={card.posterPath} alt={card.name} priority={priority} sizes={sizes} imgClassName="transition duration-500 ease-out group-hover:scale-[1.05]" />

          {rank ? (
            <>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/70 to-transparent" />
              <span className="absolute bottom-1.5 left-2.5 flex items-end gap-1.5">
                <span aria-hidden="true" className="tnum text-[60px] leading-[0.82] font-medium tracking-[-0.07em] text-white md:text-[72px]">
                  {rank}
                </span>
                <span lang="en" aria-hidden="true" className="mb-1 text-[9px] leading-[1.1] font-bold tracking-[0.12em] text-white/60 uppercase">
                  Top
                  <br />
                  10
                </span>
              </span>
            </>
          ) : (
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 to-transparent" />
          )}

          {shownBadge ? <span className="absolute top-2 left-2 transition-opacity duration-200 [@media(hover:hover)]:group-hover:opacity-0">{shownBadge}</span> : null}

          {/* Hover facts (pointer devices only) */}
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden flex-col justify-end bg-black/80 p-3 text-white opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 [@media(hover:hover)]:flex"
          >
            {card.score ? (
              <span className="tnum flex items-center gap-1.5 text-[24px] leading-none font-medium tracking-[-0.03em]">
                <StarIcon className="size-4 text-leaving" />
                {card.score.toFixed(1)}
              </span>
            ) : null}
            <span className="tnum mt-2 line-clamp-2 text-xs leading-snug text-white/70">{[card.year, card.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}</span>
            <span className="mt-2.5 space-y-1 border-t border-text/12 pt-2.5 text-xs font-semibold">
              <LangLine on={card.dub} tone="dub" label={dubTerm(lang)} localLang={edition.hreflang} />
              <LangLine on={card.sub} tone="sub" label={subTerm(lang)} localLang={edition.hreflang} />
            </span>
            <span className="h-7" />
          </span>

          {card.services[0] ? (
            <span className="absolute right-2 bottom-2 flex items-center gap-1">
              {card.services.slice(0, 2).map((s) => (
                <ServiceLogo key={s.slug} {...s} size={22} className="ring-1 ring-black/50" />
              ))}
              {extra > 0 ? <span className="tnum flex h-[22px] items-center rounded-full bg-black/75 px-1.5 text-[10px] font-medium text-white ring-1 ring-text/15">+{extra}</span> : null}
            </span>
          ) : null}
        </div>
        <div className="mt-2.5 truncate text-sm leading-5 font-semibold text-text transition-colors group-hover:text-orange-press">{card.name}</div>
        {metaLine || card.score ? (
          <div className="tnum flex min-w-0 items-center gap-1 text-xs leading-[18px] text-text-3">
            {/* Score stays visible at rest (touch has no hover) — ivi/santehnika show it on every card. */}
            {card.score ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-text-2" title="TMDB score">
                <StarIcon className="size-3 text-leaving" />
                {card.score.toFixed(1)}
              </span>
            ) : null}
            {card.score && metaLine ? <span aria-hidden="true">·</span> : null}
            {meta === undefined && card.services[0] && card.year ? (
              // Default line on narrow grids: the service logo is already on the poster, keep the year readable.
              <span className="truncate">
                <span className="max-sm:hidden">{card.services[0].name} · </span>
                {card.year}
              </span>
            ) : metaLine ? (
              <span className="truncate">{metaLine}</span>
            ) : null}
          </div>
        ) : null}
      </Link>
      <QuickSave title={{ id: card.id, type: card.type, slug: card.slug, name: card.name, posterPath: card.posterPath, year: card.year }} />
    </div>
  );
}

function LangLine({ on, tone, label, localLang }: { on: boolean; tone: "dub" | "sub"; label: string; localLang: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${on ? "text-white" : "text-white/40"}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${on ? (tone === "dub" ? "bg-dub" : "bg-text") : "bg-text/25"}`} />
      <span lang={localLang} className="truncate">
        {label}
      </span>
      {on ? null : <span className="ml-auto shrink-0 text-[10px] font-medium">not confirmed</span>}
    </span>
  );
}
