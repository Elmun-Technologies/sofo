import { ArrowUpRightIcon, StarIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { buttonClass } from "@/components/ui/button";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { Edition } from "@/lib/editions";
import { formatPrice, initials } from "@/lib/format";
import { dubTerm, subTerm } from "@/lib/lang";
import type { WatchOption } from "@/lib/queries/value-pages";
import { offerTypeLabel, offerVerb } from "@/lib/services";
import type { LangState } from "@/lib/short-answer";

/**
 * Edition-language audio / subtitle status for one offer, as quiet dot + text marks.
 * Only confirmed_yes reads as positive; unknown audio says so — never a guess (business rule 3).
 */
export function LangBadges({
  audio,
  subtitle,
  edition,
  size = "short",
  prefix,
  className = "",
}: {
  audio: LangState;
  subtitle: LangState;
  edition: Edition;
  size?: "short" | "long";
  prefix?: string;
  className?: string;
}) {
  const code = edition.code.toUpperCase();
  const long = size === "long";
  const dub = long ? dubTerm(edition.contentLang) : `${code} dub`;
  const sub = long ? subTerm(edition.contentLang) : `${code} sub`;
  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs leading-5 font-medium ${className}`}>
      {audio === "confirmed_yes" ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-text">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-dub" />
          <span lang={long ? edition.hreflang : undefined}>
            {prefix ? `${prefix} · ` : ""}
            {dub}
          </span>
          <span className="sr-only"> confirmed</span>
        </span>
      ) : null}
      {subtitle === "confirmed_yes" ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-text-2">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-white/70" />
          <span lang={long ? edition.hreflang : undefined}>{sub}</span>
          <span className="sr-only"> confirmed</span>
        </span>
      ) : null}
      {audio === "unknown" ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-leaving" title="Not confirmed by the service">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full ring-1 ring-leaving ring-inset" />
          {code} audio not confirmed
        </span>
      ) : null}
      {audio === "confirmed_no" && subtitle !== "confirmed_yes" ? <span className="whitespace-nowrap text-text-3">No {code} audio</span> : null}
    </span>
  );
}

/** Title-level language mark from a card (dub / subtitles confirmed on any active offer, otherwise "not confirmed"). */
export function CardLang({ dub, sub, edition, className = "" }: { dub: boolean; sub: boolean; edition: Edition; className?: string }) {
  return <LangBadges audio={dub ? "confirmed_yes" : "unknown"} subtitle={sub ? "confirmed_yes" : "unknown"} edition={edition} size="long" className={className} />;
}

/** Service tile + name + offer type. */
export function ServiceLine({ option, showType = true, size = 28, note }: { option: WatchOption; showType?: boolean; size?: number; note?: React.ReactNode }) {
  const price = option.type === "rent" || option.type === "buy" ? formatPrice(option.price, option.currency) : null;
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <ServiceLogo slug={option.serviceSlug} name={option.serviceName} logoPath={option.logoPath} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm leading-5 font-medium">{option.serviceName}</span>
        {showType || note ? (
          <span className="tnum block truncate text-xs leading-4 text-text-3">
            {showType ? offerTypeLabel(option.type) : null}
            {showType && price ? ` · ${price}` : ""}
            {showType && note ? " · " : null}
            {note}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** Outbound CTA to the legal service (tracked). Orange is reserved for exactly this action. */
export function WatchButton({
  option,
  title,
  edition,
  label,
  variant = "accent",
  size = "md",
  className = "",
}: {
  option: WatchOption;
  title: string;
  edition: Edition;
  label?: React.ReactNode;
  variant?: "accent" | "secondary" | "ghost";
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  return (
    <OutboundLink
      href={option.url}
      service={option.serviceSlug}
      title={title}
      country={edition.country}
      lang={edition.contentLang}
      offerType={option.type}
      className={`${buttonClass(variant, size)} ${className}`}
    >
      {label ?? `${offerVerb(option.type)} on ${option.serviceName}`}
      <ArrowUpRightIcon className={size === "sm" ? "size-3.5" : "size-[18px]"} />
      {label ? (
        <span className="sr-only">
          {" "}
          {title} on {option.serviceName}
        </span>
      ) : null}
    </OutboundLink>
  );
}

/** Round icon-only outbound link for tight rows (phones). Same tracking as WatchButton. */
export function WatchIconLink({ option, title, edition, className = "" }: { option: WatchOption; title: string; edition: Edition; className?: string }) {
  return (
    <OutboundLink
      href={option.url}
      service={option.serviceSlug}
      title={title}
      country={edition.country}
      lang={edition.contentLang}
      offerType={option.type}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset hover:bg-white/6 hover:ring-white/30 active:scale-95 ${className}`}
    >
      <ArrowUpRightIcon className="size-4" />
      <span className="sr-only">
        {offerVerb(option.type)} {title} on {option.serviceName}
      </span>
    </OutboundLink>
  );
}

/** Text-only outbound link ("Watch" + arrow). */
export function WatchTextLink({ option, title, edition, label = "Watch", className = "" }: { option: WatchOption; title: string; edition: Edition; label?: string; className?: string }) {
  return (
    <OutboundLink
      href={option.url}
      service={option.serviceSlug}
      title={title}
      country={edition.country}
      lang={edition.contentLang}
      offerType={option.type}
      className={`inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap text-text-2 underline decoration-hairline-strong underline-offset-4 hover:text-text hover:decoration-current ${className}`}
    >
      {label}
      <ArrowUpRightIcon className="size-3.5" />
    </OutboundLink>
  );
}

/** People are shown without photos — initials only (licensing). */
export function InitialsAvatar({ name, size = 160, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface font-normal tracking-[-0.05em] text-text ring-1 ring-hairline-strong ring-inset ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}

/** TMDB score: star + number (tabular). */
export function RatingBar({ score, className = "" }: { score: number | null; className?: string }) {
  if (score == null)
    return (
      <span className={`text-xs text-text-3 ${className}`} aria-label="No rating">
        —
      </span>
    );
  return (
    <span className={`tnum inline-flex items-center gap-1 text-[13px] font-medium text-text-2 ${className}`} title={`TMDB ${score.toFixed(1)} / 10`}>
      <StarIcon className="size-3 text-text-3" />
      <span className="sr-only">TMDB </span>
      {score.toFixed(1)}
    </span>
  );
}

export function formatDuration(sec: number | null | undefined): string | null {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
