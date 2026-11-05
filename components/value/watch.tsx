import { OutboundLink } from "@/components/outbound-link";
import { DubBadge, MutedBadge, SubBadge } from "@/components/ui/badges";
import { buttonClass } from "@/components/ui/button";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { Edition } from "@/lib/editions";
import { formatPrice, initials } from "@/lib/format";
import { dubTerm, subTerm } from "@/lib/lang";
import type { WatchOption } from "@/lib/queries/value-pages";
import { offerTypeLabel, offerVerb } from "@/lib/services";
import type { LangState } from "@/lib/short-answer";

const Check = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="ml-0.5">
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Edition-language audio / subtitle badges for one offer. Only confirmed_yes renders a positive badge;
 * unknown audio says so — never a guess (business rule 3).
 */
export function LangBadges({ audio, subtitle, edition, size = "short", prefix }: { audio: LangState; subtitle: LangState; edition: Edition; size?: "short" | "long"; prefix?: string }) {
  const code = edition.code.toUpperCase();
  const dub = size === "short" ? `${code} dub` : dubTerm(edition.contentLang);
  const sub = size === "short" ? `${code} sub` : subTerm(edition.contentLang);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {audio === "confirmed_yes" ? (
        <DubBadge>
          {prefix ? `${prefix} · ` : ""}
          {dub}
          <Check />
        </DubBadge>
      ) : null}
      {subtitle === "confirmed_yes" ? (
        size === "short" ? (
          <MutedBadge>
            {sub}
            <Check />
          </MutedBadge>
        ) : (
          <SubBadge>
            {sub}
            <Check />
          </SubBadge>
        )
      ) : null}
      {audio === "unknown" ? (
        <span className="text-[11px] font-semibold text-leaving" title="Not confirmed by the service">
          {code} audio not confirmed
        </span>
      ) : null}
      {audio === "confirmed_no" && subtitle !== "confirmed_yes" ? <MutedBadge>No {code} audio</MutedBadge> : null}
    </span>
  );
}

/** Service tile + name + offer type. */
export function ServiceLine({ option, showType = true, size = 28 }: { option: WatchOption; showType?: boolean; size?: number }) {
  const price = option.type === "rent" || option.type === "buy" ? formatPrice(option.price, option.currency) : null;
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <ServiceLogo slug={option.serviceSlug} name={option.serviceName} logoPath={option.logoPath} size={size} />
      <span className="truncate text-sm font-extrabold">{option.serviceName}</span>
      {showType ? (
        <span className="hidden truncate text-xs text-text-2 sm:inline">
          {offerTypeLabel(option.type)}
          {price ? ` · ${price}` : ""}
        </span>
      ) : null}
    </span>
  );
}

/** Outbound CTA to the legal service (tracked). */
export function WatchButton({
  option,
  title,
  edition,
  label,
  variant = "primary",
  size = "md",
  className = "",
}: {
  option: WatchOption;
  title: string;
  edition: Edition;
  label?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
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
      {label ?? `${offerVerb(option.type)} on ${option.serviceName}`} <span aria-hidden="true">↗</span>
    </OutboundLink>
  );
}

/** Text-only outbound link ("Watch ↗"). */
export function WatchTextLink({ option, title, edition, label = "Watch", className = "" }: { option: WatchOption; title: string; edition: Edition; label?: string; className?: string }) {
  return (
    <OutboundLink
      href={option.url}
      service={option.serviceSlug}
      title={title}
      country={edition.country}
      lang={edition.contentLang}
      offerType={option.type}
      className={`text-sm font-extrabold whitespace-nowrap text-orange ${className}`}
    >
      {label} <span aria-hidden="true">↗</span>
    </OutboundLink>
  );
}

/** People are shown without photos — initials only (licensing). */
export function InitialsAvatar({ name, size = 160, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-orange-deep font-extrabold tracking-[-0.03em] text-orange ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
    >
      {initials(name)}
    </span>
  );
}

/** TMDB score as a 10-step bar. */
export function RatingBar({ score, className = "" }: { score: number | null; className?: string }) {
  if (score == null) return <span className="text-xs text-text-3">No rating</span>;
  const pct = Math.max(0, Math.min(100, score * 10));
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} title={`TMDB ${score.toFixed(1)} / 10`}>
      <span className="relative h-1.5 w-16 overflow-hidden rounded-chip bg-line md:w-20" aria-hidden="true">
        <span className={`absolute inset-y-0 left-0 rounded-chip ${score >= 8 ? "bg-available" : score >= 7 ? "bg-orange" : "bg-leaving"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs font-bold text-text-2 tabular-nums">
        <span className="sr-only">TMDB </span>
        {score.toFixed(1)}
      </span>
    </span>
  );
}

export function formatDuration(sec: number | null | undefined): string | null {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
