import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Editorial page header for the value pages (calendar, trailers, tracker, person):
 * outlined tags, one oversized light headline, a one-line intro, optional stats on the right.
 */
export function ValueHero({
  tags,
  title,
  intro,
  aside,
  children,
  size = "display",
}: {
  tags?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  size?: "display" | "h1";
}) {
  return (
    <header className="wrap pt-7 md:pt-14">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="max-w-3xl min-w-0">
          {tags ? <div className="mb-4 flex flex-wrap gap-2 md:mb-6">{tags}</div> : null}
          <h1 className={size === "display" ? "text-display" : "text-h1"}>{title}</h1>
          {intro ? <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-2 md:mt-5 md:text-[17px]">{intro}</p> : null}
        </div>
        {aside}
      </div>
      {children ? <div className="mt-7 md:mt-10">{children}</div> : null}
    </header>
  );
}

/** Row of oversized light counters. */
export function Stats({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <dl className={`flex shrink-0 gap-8 md:gap-12 ${className}`}>{children}</dl>;
}

export function Stat({ value, label, dot }: { value: React.ReactNode; label: React.ReactNode; dot?: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="mt-2 flex items-center gap-1.5 text-[13px] leading-5 whitespace-nowrap text-text-2">
        {dot ? <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${dot}`} /> : null}
        {label}
      </dt>
      <dd className="numeral">{value}</dd>
    </div>
  );
}

/** Editorial section heading: thin rule, optional counter, heading, one-line sub, optional action on the right. */
export function SectionHead({
  id,
  index,
  title,
  sub,
  action,
  className = "",
}: {
  id?: string;
  index?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 md:mb-8 ${className}`}>
      <div aria-hidden="true" className="rule" />
      <div className="flex items-end justify-between gap-4 pt-4 md:pt-6">
        <div className="flex min-w-0 items-baseline gap-4 md:gap-6">
          {index ? (
            <span aria-hidden="true" className="tnum shrink-0 text-sm text-text-3">
              {index}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 id={id} className="text-h2">
              {title}
            </h2>
            {sub ? <p className="mt-1.5 text-sm text-text-2">{sub}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

/** Text link that ends in an arrow-in-circle (internal navigation). */
export function ArrowLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group/arrow inline-flex items-center justify-between gap-3 text-sm font-medium text-text hover:text-text ${className}`}>
      <span className="min-w-0 truncate">{children}</span>
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset group-hover/arrow:bg-text group-hover/arrow:text-ink group-hover/arrow:ring-transparent">
        <ArrowRightIcon className="size-4" />
      </span>
    </Link>
  );
}
