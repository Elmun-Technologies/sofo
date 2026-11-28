import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
import type { CatalogFilters, CatalogResult } from "@/lib/queries/catalog-pages";
import { cap, catalogHref, DECADES, decadeLabel, OFFER_LABELS } from "./catalog-url";
import { Dropdown } from "./dropdown";
import { menuItemClass, MenuMark, pillClass } from "./menu";

type Props = { edition: Edition; base: string; filters: CatalogFilters; result: CatalogResult };

const GROUP = "catalog-filters";

/**
 * Desktop filter bar (lg+): the two language toggles — the reason people come here — sit in the open,
 * everything else is one pill per facet. Every option is a link → shareable, crawl-safe
 * (filtered combinations are noindex).
 */
export function FilterBar({ edition: e, base, filters: f, result: r }: Props) {
  const to = (patch: Partial<CatalogFilters>) => catalogHref(base, { ...f, ...patch, page: 1 });
  const service = r.services.find((s) => s.slug === f.service);
  const audio = [
    { key: "dub" as const, label: cap(dubTerm(e.contentLang)), count: r.audioCounts.dub, dot: "bg-dub" },
    { key: "sub" as const, label: cap(subTerm(e.contentLang)), count: r.audioCounts.sub, dot: "bg-text-2" },
  ];

  return (
    <nav aria-label="Filters" className="flex min-w-0 items-center gap-2">
      {audio.map((a) => {
        const on = f.audio === a.key;
        return (
          <Link
            key={a.key}
            href={to({ audio: on ? undefined : a.key })}
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={`${pillClass(on)} !rounded-full ${on ? "" : "!bg-transparent ring-1 ring-hairline-strong ring-inset"}`}
          >
            <span aria-hidden="true" className="-ml-0.5 text-[15px] leading-none font-bold">{on ? "✓" : "+"}</span>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${on && a.key === "sub" ? "bg-ink/50" : a.dot}`} />
            <span lang={e.hreflang}>{a.label}</span>
          </Link>
        );
      })}

      <span aria-hidden="true" className="mx-1.5 h-5 w-px shrink-0 bg-hairline-strong" />

      <Dropdown name="Service" group={GROUP} active={!!service} label={service?.name ?? "Service"} panelClassName="w-64">
        <ul>
          {r.services.map((s) => {
            const on = f.service === s.slug;
            return (
              <li key={s.slug}>
                <Link href={to({ service: on ? undefined : s.slug })} scroll={false} aria-current={on ? "true" : undefined} className={menuItemClass(on, s.count === 0)}>
                  <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={22} className={s.count === 0 && !on ? "opacity-50" : ""} />
                  <span className="truncate">{s.name}</span>
                  <MenuMark active={on} count={s.count} />
                </Link>
              </li>
            );
          })}
        </ul>
      </Dropdown>

      <Dropdown name="Price" group={GROUP} active={!!f.offer} label={f.offer ? OFFER_LABELS[f.offer] : "Price"} panelClassName="w-52">
        <ul>
          {(Object.keys(OFFER_LABELS) as (keyof typeof OFFER_LABELS)[]).map((o) => {
            const on = f.offer === o;
            return (
              <li key={o}>
                <Link href={to({ offer: on ? undefined : o })} scroll={false} aria-current={on ? "true" : undefined} className={menuItemClass(on)}>
                  {o === "free" ? <span aria-hidden="true" className="size-1.5 rounded-full bg-free" /> : null}
                  {OFFER_LABELS[o]}
                  <MenuMark active={on} />
                </Link>
              </li>
            );
          })}
        </ul>
      </Dropdown>

      {r.genres.length ? (
        <Dropdown name="Genre" group={GROUP} active={!!r.genreName} label={r.genreName ?? "Genre"} panelClassName={r.genres.length > 8 ? "w-[420px]" : "w-56"}>
          <ul className={r.genres.length > 8 ? "grid grid-cols-2" : undefined}>
            {r.genres.map((g) => {
              const on = f.genre === g.slug;
              return (
                <li key={g.slug}>
                  <Link href={to({ genre: on ? undefined : g.slug })} scroll={false} aria-current={on ? "true" : undefined} className={menuItemClass(on)}>
                    <span className="truncate">{g.name}</span>
                    <MenuMark active={on} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Dropdown>
      ) : null}

      <Dropdown name="Year" group={GROUP} active={f.decade != null} label={f.decade != null ? decadeLabel(f.decade) : "Year"} panelClassName="w-48">
        <ul>
          {DECADES.map((d) => {
            const on = f.decade === d;
            return (
              <li key={d}>
                <Link href={to({ decade: on ? undefined : d })} scroll={false} aria-current={on ? "true" : undefined} className={`${menuItemClass(on)} tnum`}>
                  {decadeLabel(d)}
                  <MenuMark active={on} />
                </Link>
              </li>
            );
          })}
        </ul>
      </Dropdown>
    </nav>
  );
}
