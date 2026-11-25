import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { ServiceLogo } from "@/components/ui/service-logo";

export type SearchParams = Record<string, string | string[] | undefined>;

/** First value of a search param. */
export function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** `base?…` with `patch` applied to the current params (null/undefined removes a key). */
export function hrefWith(base: string, current: Record<string, string | undefined>, patch: Record<string, string | null | undefined>): string {
  const p = new URLSearchParams();
  const merged: Record<string, string | null | undefined> = { ...current, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

/** Service filter ("All" + one logo per service), URL-driven. Swipes to the screen edge on phones. */
export function ServiceChips({
  services,
  active,
  hrefFor,
  className = "",
}: {
  services: { slug: string; name: string; logoPath: string | null }[];
  active: string | undefined;
  hrefFor: (slug: string | null) => string;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Service" className={`no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0 ${className}`}>
      <Link
        href={hrefFor(null)}
        scroll={false}
        aria-current={!active ? "true" : undefined}
        className={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition duration-200 ease-out ${
          !active ? "bg-white text-ink hover:text-ink" : "text-text-2 ring-1 ring-hairline-strong ring-inset hover:bg-white/6 hover:text-text"
        }`}
      >
        All services
      </Link>
      {services.map((s) => {
        const on = active === s.slug;
        return (
          <Link
            key={s.slug}
            href={hrefFor(s.slug)}
            scroll={false}
            aria-label={s.name}
            title={s.name}
            aria-current={on ? "true" : undefined}
            className={`shrink-0 rounded-[11px] p-[3px] ring-1 ring-inset transition duration-200 ease-out ${
              on ? "ring-white" : `ring-transparent hover:ring-hairline-strong ${active ? "opacity-45 hover:opacity-100" : ""}`
            }`}
          >
            <ServiceLogo {...s} size={30} />
          </Link>
        );
      })}
    </div>
  );
}

/** Segmented pill control for mutually exclusive views (weeks, sort orders). Links, so it works without JS. */
export function Segmented({ label, options, className = "" }: { label: string; options: { href: string; label: React.ReactNode; active: boolean }[]; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex h-11 max-w-full shrink-0 items-center rounded-full p-1 ring-1 ring-hairline-strong ring-inset ${className}`}>
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          scroll={false}
          aria-current={o.active ? "true" : undefined}
          className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition duration-200 ease-out ${
            o.active ? "bg-white text-ink hover:text-ink" : "text-text-2 hover:text-text"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/** On/off filter chip with a check mark when on ("Only Turkish dub"). */
export function ToggleChip({ href, active, children, dot }: { href: string; active: boolean; children: React.ReactNode; dot?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition duration-200 ease-out active:scale-[0.97] ${
        active ? "bg-white text-ink hover:text-ink" : "text-text-2 ring-1 ring-hairline-strong ring-inset hover:bg-white/6 hover:text-text hover:ring-white/30"
      }`}
    >
      {active ? <CheckIcon className="size-3.5" /> : dot ? <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} /> : null}
      {children}
    </Link>
  );
}
