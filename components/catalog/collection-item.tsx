import Link from "next/link";
import { ArrowUpRightIcon, CaptionsIcon, StarIcon, VolumeIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { Pill } from "@/components/ui/badges";
import { buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { paths, type Edition } from "@/lib/editions";
import { formatPrice, formatRuntime } from "@/lib/format";
import { dubTerm, subTerm } from "@/lib/lang";
import type { CollectionData } from "@/lib/queries/catalog-pages";
import { offerTypeLabel, offerVerb } from "@/lib/services";

type Item = CollectionData["items"][number];

/** Never guess: an unconfirmed dub is said out loud, in the "leaving" tone. */
function LangPills({ item, edition }: { item: Item; edition: Edition }) {
  const dub = item.audio === "confirmed_yes";
  const sub = item.subtitle === "confirmed_yes";
  // No audio row at all is the same as "unknown" (ingest never writes a guess) — but only worth saying when the title is streaming.
  const unknown = !!item.best && !dub && item.audio !== "confirmed_no";
  if (!dub && !sub && !unknown) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {dub ? (
        <Pill tone="dub">
          <VolumeIcon className="size-3.5" />
          <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>
        </Pill>
      ) : null}
      {sub ? (
        <Pill>
          <CaptionsIcon className="size-3.5" />
          <span lang={edition.hreflang} className="text-text">
            {subTerm(edition.contentLang)}
          </span>
        </Pill>
      ) : null}
      {unknown ? <Pill tone="leaving">Dub not confirmed by the service</Pill> : null}
    </span>
  );
}

/** One numbered entry of a collection: poster · what it is · language status · where to watch. */
export function CollectionItem({ item, rank, edition: e, primary }: { item: Item; rank: number; edition: Edition; primary?: boolean }) {
  const c = item.card;
  const href = paths.title(e, c.type, c.slug);
  const meta = [c.year, formatRuntime(item.runtimeMin)].filter(Boolean).join(" · ");
  const text = item.blurb ?? item.overview;
  const b = item.best;
  const price = b && (b.type === "rent" || b.type === "buy") ? formatPrice(b.price, b.currency) : null;
  const outbound = b ? { href: b.url, service: b.service.slug, title: c.name, country: e.country, lang: e.contentLang, offerType: b.type } : null;

  return (
    <li className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3.5 gap-y-4 border-t border-hairline-strong py-5 md:grid-cols-[52px_96px_minmax(0,1fr)_220px] md:gap-x-5 md:py-8 lg:grid-cols-[72px_112px_minmax(0,1fr)_264px] lg:gap-x-7">
      <span aria-hidden="true" className="hidden text-[44px] leading-[0.9] font-normal tracking-[-0.05em] text-text-3 md:block lg:text-[56px]">
        {String(rank).padStart(2, "0")}
      </span>

      <div className="relative w-[72px] md:w-auto">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <PosterImage path={c.posterPath} alt="" sizes="(max-width: 767px) 72px, 112px" />
        </Link>
        <span aria-hidden="true" className="tnum absolute top-1.5 left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/70 px-1.5 text-[11px] font-semibold text-white ring-1 ring-text/15 backdrop-blur-md md:hidden">
          {rank}
        </span>
      </div>

      <div className="min-w-0 md:pt-1">
        <h2 lang={e.hreflang} className="text-[17px] leading-snug font-semibold tracking-[-0.02em] md:text-[26px] md:leading-[1.15] md:font-medium md:tracking-[-0.03em]">
          <Link href={href} className="hover:text-text max-md:after:absolute max-md:after:inset-0">
            {c.name}
          </Link>
        </h2>
        <p className="tnum mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-2 md:mt-2.5 md:text-sm">
          {c.score ? (
            <span className="inline-flex items-center gap-1 font-semibold text-text" title="TMDB score">
              <StarIcon className="size-3 text-leaving" />
              <span className="sr-only">TMDB </span>
              {c.score.toFixed(1)}
            </span>
          ) : null}
          {meta ? <span>{meta}</span> : null}
        </p>
        {b ? (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-text-2 md:hidden">
            <ServiceLogo {...b.service} size={18} />
            <span className="truncate">
              {b.service.name} · {offerTypeLabel(b.type)}
              {price ? ` ${price}` : ""}
            </span>
          </p>
        ) : null}
        {text ? (
          <p lang={e.hreflang} className="mt-3.5 hidden max-w-xl text-[15px] leading-relaxed text-text-2 md:block">
            {text}
          </p>
        ) : null}
        <div className="mt-2.5 empty:hidden md:mt-4">
          <LangPills item={item} edition={e} />
        </div>
        {b && item.checkedAt ? <CheckedAt at={item.checkedAt} className="mt-2 block md:hidden" /> : null}
        {!b ? <p className="mt-2 text-xs text-text-3 md:hidden">Not streaming in {e.countryName} right now</p> : null}
      </div>

      {/* Phones: the outbound action is a round button; the rest of the row opens the title page. */}
      {outbound && b ? (
        <OutboundLink {...outbound} className={`relative z-10 flex size-11 items-center justify-center rounded-full transition duration-200 ease-out active:scale-95 md:hidden ${primary ? "bg-orange text-ink hover:bg-orange-hover hover:text-ink" : "bg-text/10 text-text hover:bg-text/16 hover:text-text"}`}>
          <ArrowUpRightIcon className="size-[18px]" />
          <span className="sr-only">
            {offerVerb(b.type)} {c.name} on {b.service.name}
          </span>
        </OutboundLink>
      ) : (
        <span className="md:hidden" />
      )}

      {/* Desktop: where to watch */}
      <div className="hidden md:block md:pt-1">
        {outbound && b ? (
          <>
            <div className="flex items-center gap-3">
              <ServiceLogo {...b.service} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">{b.service.name}</span>
                <span className="tnum block text-xs text-text-3">
                  {offerTypeLabel(b.type)}
                  {price ? ` · ${price}` : ""}
                </span>
              </span>
            </div>
            <OutboundLink {...outbound} className={`${buttonClass(primary ? "accent" : "secondary")} mt-4 w-full`}>
              <span className="truncate">
                {offerVerb(b.type)} on {b.service.name}
              </span>
              <ArrowUpRightIcon className="size-4 shrink-0" />
            </OutboundLink>
            {item.checkedAt ? <CheckedAt at={item.checkedAt} className="mt-3 block text-center" /> : null}
          </>
        ) : (
          <p className="flex items-start gap-2.5 rounded-card border border-dashed border-hairline-strong px-4 py-3.5 text-[13px] leading-snug text-text-3">
            Not streaming in {e.countryName} right now
          </p>
        )}
      </div>
    </li>
  );
}
