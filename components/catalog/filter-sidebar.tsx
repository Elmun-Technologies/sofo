import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import type { CatalogFilters, CatalogResult } from "@/lib/queries/catalog-pages";
import { cap, catalogHref, DECADES, decadeLabel, OFFER_LABELS } from "./catalog-url";

type Props = { edition: Edition; base: string; filters: CatalogFilters; result: CatalogResult };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <h2 lang="en" className="mb-2.5 text-xs font-extrabold tracking-[0.08em] text-text-2 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function CheckLink({ href, active, count, children }: { href: string; active: boolean; count?: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className="flex items-center gap-2.5 rounded-lg py-1.5 text-[15px] text-text hover:text-text"
    >
      <span
        aria-hidden="true"
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border ${active ? "border-orange bg-orange text-ink" : "border-line"}`}
      >
        {active ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="flex min-w-0 grow items-center gap-2">{children}</span>
      {count != null ? <span className="text-xs text-text-3 tabular-nums">{count.toLocaleString("en-US")}</span> : null}
    </Link>
  );
}

function PillLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-8 items-center rounded-chip px-3 text-[13px] font-bold ${active ? "bg-white text-ink hover:text-ink" : "border border-line bg-surface text-text hover:border-text-3 hover:text-text"}`}
    >
      {children}
    </Link>
  );
}

/** Desktop filter sidebar (lg+). Every option is a link → shareable, crawl-safe (noindex on filtered pages). */
export function FilterSidebar({ edition, base, filters: f, result }: Props) {
  const to = (patch: Partial<CatalogFilters>) => catalogHref(base, { ...f, ...patch, page: 1 });
  return (
    <nav aria-label="Filters" className="text-sm">
      <Section title="Audio">
        <CheckLink href={to({ audio: f.audio === "dub" ? undefined : "dub" })} active={f.audio === "dub"} count={result.audioCounts.dub}>
          {cap(dubTerm(edition.contentLang))}
        </CheckLink>
        <CheckLink href={to({ audio: f.audio === "sub" ? undefined : "sub" })} active={f.audio === "sub"} count={result.audioCounts.sub}>
          {cap(subTerm(edition.contentLang))}
        </CheckLink>
      </Section>
      <Section title="Services">
        {result.services.map((s) => (
          <CheckLink key={s.slug} href={to({ service: f.service === s.slug ? undefined : s.slug })} active={f.service === s.slug} count={s.count}>
            <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={20} />
            <span className="truncate">{s.name}</span>
          </CheckLink>
        ))}
      </Section>
      <Section title="Price">
        {(Object.keys(OFFER_LABELS) as (keyof typeof OFFER_LABELS)[]).map((o) => (
          <CheckLink key={o} href={to({ offer: f.offer === o ? undefined : o })} active={f.offer === o}>
            {OFFER_LABELS[o]}
          </CheckLink>
        ))}
      </Section>
      {result.genres.length ? (
        <Section title="Genre">
          <div className="flex flex-wrap gap-2">
            {result.genres.map((g) => (
              <PillLink key={g.slug} href={to({ genre: f.genre === g.slug ? undefined : g.slug })} active={f.genre === g.slug}>
                {g.name}
              </PillLink>
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="Year">
        <div className="flex flex-wrap gap-2">
          {DECADES.map((d) => (
            <PillLink key={d} href={to({ decade: f.decade === d ? undefined : d })} active={f.decade === d}>
              {decadeLabel(d)}
            </PillLink>
          ))}
        </div>
      </Section>
    </nav>
  );
}
