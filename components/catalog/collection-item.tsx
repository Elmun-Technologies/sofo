import Link from "next/link";
import { OutboundLink } from "@/components/outbound-link";
import { DubBadge, MutedBadge, SubBadge } from "@/components/ui/badges";
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

/** Never guess: unconfirmed language is said out loud. */
function LangBadges({ item, edition }: { item: Item; edition: Edition }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {item.audio === "confirmed_yes" ? <DubBadge>{dubTerm(edition.contentLang)}</DubBadge> : null}
      {item.subtitle === "confirmed_yes" ? <SubBadge>{subTerm(edition.contentLang)}</SubBadge> : null}
      {item.audio === "unknown" ? <MutedBadge>Dub not confirmed by the service</MutedBadge> : null}
    </span>
  );
}

export function CollectionItem({ item, rank, edition: e, primary }: { item: Item; rank: number; edition: Edition; primary?: boolean }) {
  const c = item.card;
  const href = paths.title(e, c.type, c.slug);
  const meta = [c.year, formatRuntime(item.runtimeMin)].filter(Boolean).join(" · ");
  const text = item.blurb ?? item.overview;
  const b = item.best;
  const price = b && (b.type === "rent" || b.type === "buy") ? formatPrice(b.price, b.currency) : null;

  return (
    <li className="relative flex items-center gap-3 rounded-card border border-line bg-surface p-3 md:gap-6 md:p-4 md:pr-5">
      <span aria-hidden="true" className="w-6 shrink-0 text-center text-2xl font-extrabold text-text-3/60 md:w-14 md:text-[44px]">
        {rank}
      </span>
      <Link href={href} className="w-[56px] shrink-0 md:w-[100px]" tabIndex={-1} aria-hidden="true">
        <PosterImage path={c.posterPath} alt="" sizes="100px" />
      </Link>
      <div className="min-w-0 grow">
        <h2 className="text-[17px] leading-snug font-extrabold md:text-[22px]">
          <Link href={href} className="text-text after:absolute after:inset-0 md:after:hidden">
            {c.name}
          </Link>
        </h2>
        <p className="mt-1 hidden text-[13px] text-text-2 md:block">
          {meta}
          {c.score ? (
            <>
              {meta ? " · " : ""}
              <span className="font-extrabold text-available">TMDB {c.score.toFixed(1)}</span>
            </>
          ) : null}
        </p>
        {b ? (
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-text-2 md:hidden">
            <ServiceLogo {...b.service} size={18} /> {b.service.name}
          </p>
        ) : null}
        {text ? <p className="mt-2 hidden max-w-xl text-[15px] leading-relaxed text-text md:block">{text}</p> : null}
        <div className="mt-2">
          <LangBadges item={item} edition={e} />
        </div>
      </div>
      {b ? (
        <div className="relative z-10 shrink-0 md:w-[240px]">
          <div className="hidden items-center gap-2 md:flex">
            <ServiceLogo {...b.service} size={28} />
            <span className="text-sm font-extrabold">{b.service.name}</span>
            <span className="text-xs text-text-2">
              {offerTypeLabel(b.type)}
              {price ? ` · ${price}` : ""}
            </span>
          </div>
          <OutboundLink
            href={b.url}
            service={b.service.slug}
            title={c.name}
            country={e.country}
            lang={e.contentLang}
            offerType={b.type}
            className={`${buttonClass(primary ? "primary" : "secondary")} mt-2.5 hidden w-full justify-start md:flex`}
          >
            {offerVerb(b.type)} on {b.service.name} ↗
          </OutboundLink>
          <OutboundLink
            href={b.url}
            service={b.service.slug}
            title={c.name}
            country={e.country}
            lang={e.contentLang}
            offerType={b.type}
            className="flex size-10 items-center justify-center rounded-button text-orange md:hidden"
          >
            <span aria-hidden="true">↗</span>
            <span className="sr-only">
              {offerVerb(b.type)} {c.name} on {b.service.name}
            </span>
          </OutboundLink>
          {item.checkedAt ? <CheckedAt at={item.checkedAt} className="mt-2 hidden md:block" /> : null}
        </div>
      ) : (
        <span className="relative z-10 shrink-0 text-xs text-text-3 md:w-[240px]">Not streaming in {e.countryName} right now</span>
      )}
    </li>
  );
}
