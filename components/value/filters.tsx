import Link from "next/link";
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

/** Service logo chips ("All services" + one tile per service), URL-driven. */
export function ServiceChips({
  services,
  active,
  hrefFor,
}: {
  services: { slug: string; name: string; logoPath: string | null }[];
  active: string | undefined;
  hrefFor: (slug: string | null) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={hrefFor(null)}
        scroll={false}
        aria-current={!active ? "true" : undefined}
        className={`inline-flex h-9 shrink-0 items-center rounded-chip px-3.5 text-sm font-bold whitespace-nowrap ${
          !active ? "bg-white text-ink hover:text-ink" : "border border-line bg-surface text-text hover:border-text-3 hover:text-text"
        }`}
      >
        All services
      </Link>
      {services.map((s) => (
        <Link
          key={s.slug}
          href={hrefFor(s.slug)}
          scroll={false}
          aria-label={s.name}
          title={s.name}
          aria-current={active === s.slug ? "true" : undefined}
          className={`shrink-0 rounded-[10px] transition ${active === s.slug ? "ring-2 ring-orange ring-offset-2 ring-offset-ink" : active ? "opacity-50 hover:opacity-100" : ""}`}
        >
          <ServiceLogo {...s} size={36} />
        </Link>
      ))}
    </div>
  );
}
