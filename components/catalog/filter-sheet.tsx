"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, FilterIcon } from "@/components/icons";
import { CloseButton, Dialog } from "@/components/retention/dialog";
import { buttonClass } from "@/components/ui/button";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { AudioFilter, CatalogFilters, OfferFilter } from "@/lib/queries/catalog-pages";
import { cap, catalogHref, DECADES, decadeLabel, OFFER_LABELS } from "./catalog-url";

type Props = {
  base: string;
  filters: CatalogFilters;
  dubLabel: string;
  subLabel: string;
  /** hreflang of the edition — the dub/sub terms are in the local language. */
  localLang?: string;
  services: { slug: string; name: string; logoPath: string | null; count?: number }[];
  genres: { slug: string; name: string }[];
  activeCount: number;
  className?: string;
};

const pill = (active: boolean) =>
  `inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition duration-200 ease-out active:scale-[0.97] ${
    active ? "bg-text text-ink" : "text-text-2 ring-1 ring-inset ring-hairline-strong hover:bg-text/6 hover:text-text"
  }`;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-hairline py-5 first:border-t-0 first:pt-1">
      <legend lang="en" className="overline float-left mb-3 w-full text-text-3">
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

/** Mobile/tablet filters: bottom sheet with local draft state, applied to the URL on "Show results". */
export function FilterSheet({ base, filters, dubLabel, subLabel, localLang, services, genres, activeCount, className = "" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [allGenres, setAllGenres] = useState(false);

  const toggle = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === value ? undefined : value }));

  const apply = () => {
    setOpen(false);
    router.push(catalogHref(base, { ...draft, page: 1 }), { scroll: false });
  };

  const shownGenres = allGenres ? genres : genres.slice(0, 6);
  const picked = [draft.audio, draft.service, draft.offer, draft.genre, draft.decade != null ? "d" : undefined].filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(filters);
          setOpen(true);
        }}
        className={`${buttonClass(activeCount ? "primary" : "ghost")} ${className}`}
      >
        <FilterIcon className="size-4" />
        Filters
        {activeCount ? (
          <span className="tnum -mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-text px-1.5 text-[11px] font-semibold text-white">{activeCount}</span>
        ) : null}
      </button>

      {/* Portalled: the sticky filter bar is a glass layer (backdrop-filter), which would trap a fixed dialog inside it. */}
      {open
        ? createPortal(
          <Dialog open={open} onClose={() => setOpen(false)} labelledBy="filters-title" className="md:max-w-[520px]">
            <div className="flex items-center gap-3 px-5 pt-4 pb-2 md:pt-5">
              <h2 id="filters-title" className="text-h3 flex-1">
                Filters
              </h2>
              <button type="button" className={buttonClass("quiet", "sm")} disabled={picked === 0} onClick={() => setDraft({ sort: draft.sort, page: 1 })}>
                Reset
              </button>
              <CloseButton onClick={() => setOpen(false)} />
            </div>

            <div className="px-5 pb-2">
              <Group title="Audio">
                <div className="flex flex-wrap gap-2">
                  {(["dub", "sub"] as AudioFilter[]).map((a) => {
                    const on = draft.audio === a;
                    return (
                      <button key={a} type="button" aria-pressed={on} className={pill(on)} onClick={() => toggle("audio", a)}>
                        <span aria-hidden="true" className={`size-1.5 rounded-full ${a === "dub" ? "bg-dub" : on ? "bg-ink/50" : "bg-text/70"}`} />
                        <span lang={localLang}>{cap(a === "dub" ? dubLabel : subLabel)}</span>
                      </button>
                    );
                  })}
                </div>
              </Group>
              <Group title="Services">
                <div className="grid grid-cols-4 gap-2">
                  {services.map((s) => {
                    const on = draft.service === s.slug;
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle("service", s.slug)}
                        className={`relative flex flex-col items-center gap-2 rounded-card px-1 pt-3.5 pb-3 text-[11px] leading-tight font-medium transition duration-200 ease-out active:scale-95 ${
                          on ? "bg-text/10 text-text ring-2 ring-text ring-inset" : "text-text-2 ring-1 ring-hairline ring-inset hover:bg-text/6"
                        }`}
                      >
                        <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={36} />
                        <span className="w-full truncate">{s.name}</span>
                        {on ? (
                          <span aria-hidden="true" className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-text text-ink">
                            <CheckIcon className="size-3 stroke-[3.5]" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </Group>
              <Group title="Price">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(OFFER_LABELS) as OfferFilter[]).map((o) => (
                    <button key={o} type="button" aria-pressed={draft.offer === o} className={pill(draft.offer === o)} onClick={() => toggle("offer", o)}>
                      {OFFER_LABELS[o]}
                    </button>
                  ))}
                </div>
              </Group>
              {genres.length ? (
                <Group title="Genre">
                  <div className="flex flex-wrap gap-2">
                    {shownGenres.map((g) => (
                      <button key={g.slug} type="button" aria-pressed={draft.genre === g.slug} className={pill(draft.genre === g.slug)} onClick={() => toggle("genre", g.slug)}>
                        {g.name}
                      </button>
                    ))}
                    {!allGenres && genres.length > 6 ? (
                      <button type="button" className={`${pill(false)} tnum`} onClick={() => setAllGenres(true)} aria-label={`Show ${genres.length - 6} more genres`}>
                        +{genres.length - 6} more
                      </button>
                    ) : null}
                  </div>
                </Group>
              ) : null}
              <Group title="Year">
                <div className="flex flex-wrap gap-2">
                  {DECADES.map((d) => (
                    <button key={d} type="button" aria-pressed={draft.decade === d} className={`${pill(draft.decade === d)} tnum`} onClick={() => toggle("decade", d)}>
                      {decadeLabel(d)}
                    </button>
                  ))}
                </div>
              </Group>
            </div>

            <div className="sticky bottom-0 -mb-[env(safe-area-inset-bottom)] border-t border-hairline bg-surface px-5 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
              <button type="button" onClick={apply} className={`${buttonClass("primary", "lg")} w-full`}>
                Show results
              </button>
            </div>
          </Dialog>,
            document.body,
          )
        : null}
    </>
  );
}
