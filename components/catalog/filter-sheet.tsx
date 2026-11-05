"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ServiceLogo } from "@/components/ui/service-logo";
import type { AudioFilter, CatalogFilters, OfferFilter } from "@/lib/queries/catalog-pages";
import { cap, catalogHref, DECADES, decadeLabel, OFFER_LABELS } from "./catalog-url";

type Props = {
  base: string;
  filters: CatalogFilters;
  dubLabel: string;
  subLabel: string;
  services: { slug: string; name: string; logoPath: string | null }[];
  genres: { slug: string; name: string }[];
  activeCount: number;
};

const pill = (active: boolean) =>
  `inline-flex h-10 items-center rounded-chip px-4 text-sm font-bold ${active ? "bg-white text-ink" : "border border-line bg-surface-2 text-text"}`;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-5">
      <legend lang="en" className="mb-2.5 text-xs font-extrabold tracking-[0.08em] text-text-2 uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Mobile/tablet filters: bottom sheet with local draft state, applied to the URL on "Show results". */
export function FilterSheet({ base, filters, dubLabel, subLabel, services, genres, activeCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [allGenres, setAllGenres] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggle = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === value ? undefined : value }));

  const apply = () => {
    setOpen(false);
    router.push(catalogHref(base, { ...draft, page: 1 }), { scroll: false });
  };

  const shownGenres = allGenres ? genres : genres.slice(0, 3);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(filters);
          setOpen(true);
        }}
        className={`flex h-11 grow items-center justify-center gap-2 rounded-button border bg-surface px-4 text-sm font-extrabold ${activeCount ? "border-orange" : "border-line"}`}
      >
        Filters{activeCount ? ` · ${activeCount}` : ""}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88dvh] w-full flex-col rounded-t-hero border-t border-line bg-surface"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-chip bg-line" aria-hidden="true" />
            <div className="flex items-center justify-between px-5 pt-3">
              <h2 id="filters-title" className="text-xl font-extrabold">
                Filters
              </h2>
              <button type="button" className="text-sm font-bold text-text-2" onClick={() => setDraft({ sort: draft.sort, page: 1 })}>
                Reset
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-5">
              <Group title="Audio">
                <div className="flex flex-wrap gap-2">
                  {(["dub", "sub"] as AudioFilter[]).map((a) => (
                    <button key={a} type="button" aria-pressed={draft.audio === a} className={pill(draft.audio === a)} onClick={() => toggle("audio", a)}>
                      {cap(a === "dub" ? dubLabel : subLabel)}
                    </button>
                  ))}
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
                        className={`flex flex-col items-center gap-1.5 rounded-card border px-1 py-2.5 text-[11px] font-bold ${on ? "border-orange bg-orange-deep" : "border-line bg-surface-2"}`}
                      >
                        <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={32} />
                        <span className="w-full truncate">{s.name}</span>
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
                    {!allGenres && genres.length > 3 ? (
                      <button type="button" className={pill(false)} onClick={() => setAllGenres(true)}>
                        + {genres.length - 3}
                      </button>
                    ) : null}
                  </div>
                </Group>
              ) : null}
              <Group title="Year">
                <div className="flex flex-wrap gap-2">
                  {DECADES.map((d) => (
                    <button key={d} type="button" aria-pressed={draft.decade === d} className={pill(draft.decade === d)} onClick={() => toggle("decade", d)}>
                      {decadeLabel(d)}
                    </button>
                  ))}
                </div>
              </Group>
            </div>
            <div className="border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={apply} className="h-14 w-full rounded-button bg-orange text-[17px] font-extrabold text-ink hover:bg-orange-hover">
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
