import Link from "next/link";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import type { CatalogFilters, CatalogResult } from "@/lib/queries/catalog-pages";
import { cap, catalogHref, DECADES, decadeLabel, OFFER_LABELS } from "./catalog-url";

type Props = { edition: Edition; base: string; filters: CatalogFilters; result: CatalogResult; activeCount: number; clearHref: string };

/** Checkbox-looking link: every option is a crawlable URL (filtered combinations are noindex). */
function Option({ href, on, children, count, dim, lang }: { href: string; on: boolean; children: React.ReactNode; count?: number; dim?: boolean; lang?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={on ? "true" : undefined}
      className={`group flex min-h-9 items-center gap-3 rounded-[10px] px-1.5 py-1.5 text-[14px] transition-colors hover:bg-surface hover:text-text ${dim && !on ? "text-text-3" : "text-text"}`}
    >
      <span
        aria-hidden="true"
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] ring-1 ring-inset transition-colors ${on ? "bg-orange text-text ring-orange" : "bg-ink ring-hairline-strong group-hover:ring-text/40"}`}
      >
        {on ? <CheckIcon className="size-3 stroke-[3.5]" /> : null}
      </span>
      <span lang={lang} className={`min-w-0 flex-1 truncate ${on ? "font-semibold" : ""}`}>
        {children}
      </span>
      {count != null ? <span className="tnum shrink-0 text-xs text-text-3">{count.toLocaleString("en-US")}</span> : null}
    </Link>
  );
}

function Group({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group/g border-b border-hairline py-3.5 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[15px] font-extrabold">
        {title}
        <ChevronDownIcon className="size-4 text-text-3 transition-transform group-open/g:rotate-180" />
      </summary>
      <div className="mt-2 space-y-0.5">{children}</div>
    </details>
  );
}

/** santehnika-style left filter panel (lg+). The mobile sheet keeps the same options. */
export function FilterSidebar({ edition: e, base, filters: f, result: r, activeCount, clearHref }: Props) {
  const to = (patch: Partial<CatalogFilters>) => catalogHref(base, { ...f, ...patch, page: 1 });
  const genres = r.genres;
  const shown = genres.slice(0, 8);
  const more = genres.slice(8);
  return (
    <aside aria-label="Filters" className="self-start rounded-panel bg-ink lg:sticky lg:top-36">
      <Group title="Audio & subtitles">
        <Option href={to({ audio: f.audio === "dub" ? undefined : "dub" })} on={f.audio === "dub"} count={r.audioCounts.dub} lang={e.hreflang}>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" />
            {cap(dubTerm(e.contentLang))}
          </span>
        </Option>
        <Option href={to({ audio: f.audio === "sub" ? undefined : "sub" })} on={f.audio === "sub"} count={r.audioCounts.sub} lang={e.hreflang}>
          {cap(subTerm(e.contentLang))}
        </Option>
      </Group>

      <Group title="Platform">
        {r.services.map((s) => (
          <Option key={s.slug} href={to({ service: f.service === s.slug ? undefined : s.slug })} on={f.service === s.slug} count={s.count} dim={s.count === 0}>
            <span className="inline-flex items-center gap-2">
              <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={20} />
              {s.name}
            </span>
          </Option>
        ))}
      </Group>

      <Group title="How to watch">
        {(Object.keys(OFFER_LABELS) as (keyof typeof OFFER_LABELS)[]).map((o) => (
          <Option key={o} href={to({ offer: f.offer === o ? undefined : o })} on={f.offer === o}>
            {o === "subscription" ? "In a subscription" : o === "free" ? "Free / with ads" : OFFER_LABELS[o]}
          </Option>
        ))}
      </Group>

      {genres.length ? (
        <Group title="Genre">
          {shown.map((g) => (
            <Option key={g.slug} href={to({ genre: f.genre === g.slug ? undefined : g.slug })} on={f.genre === g.slug}>
              {g.name}
            </Option>
          ))}
          {more.length ? (
            <details className="group/m">
              <summary className="flex cursor-pointer list-none items-center gap-1 px-1.5 py-2 text-[13px] font-bold text-orange-press group-open/m:hidden">
                Show {more.length} more
              </summary>
              {more.map((g) => (
                <Option key={g.slug} href={to({ genre: f.genre === g.slug ? undefined : g.slug })} on={f.genre === g.slug}>
                  {g.name}
                </Option>
              ))}
            </details>
          ) : null}
        </Group>
      ) : null}

      <Group title="Release year">
        {DECADES.map((d) => (
          <Option key={d} href={to({ decade: f.decade === d ? undefined : d })} on={f.decade === d}>
            <span className="tnum">{decadeLabel(d)}</span>
          </Option>
        ))}
      </Group>

      {activeCount ? (
        <Link href={clearHref} scroll={false} className="mt-3 flex h-11 items-center justify-center rounded-button bg-surface text-sm font-bold hover:bg-surface-2 hover:text-text">
          Reset filters ({activeCount})
        </Link>
      ) : null}
    </aside>
  );
}
