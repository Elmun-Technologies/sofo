/**
 * Editorial long-form layout for the static pages (About, Privacy): big light headline, thin rules,
 * "01." section counters, a sticky table of contents on desktop and a readable ~70ch measure.
 * Server components only.
 */

export type TocItem = { id: string; label: string };

const pad = (n: number) => String(n).padStart(2, "0");

export function EditorialHero({ eyebrow, title, intro, children }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="wrap pt-10 pb-10 md:pt-20 md:pb-16">
      <p lang="en" className="overline text-text-3">
        {eyebrow}
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-end lg:gap-16">
        <h1 className="text-display">{title}</h1>
        {intro ? <p className="max-w-xl text-base text-text-2 md:text-lg md:leading-relaxed">{intro}</p> : null}
      </div>
      {children}
    </header>
  );
}

/** Two columns from lg: sticky "On this page" + content. Below lg the TOC is a swipeable row of anchors. */
export function EditorialBody({ toc, children, aside }: { toc: TocItem[]; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="wrap pb-16 md:pb-28">
      <nav aria-label="On this page" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0 lg:hidden">
        {toc.map((t, i) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium whitespace-nowrap text-text-2 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset hover:bg-text/6 hover:text-text hover:ring-text/30"
          >
            <span aria-hidden="true" className="tnum text-text-3">
              {pad(i + 1)}
            </span>
            {t.label}
          </a>
        ))}
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-40">
            <nav aria-label="On this page">
              <p lang="en" className="overline text-text-3">
                On this page
              </p>
              <ol className="mt-4 border-l border-hairline">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="-ml-px flex items-baseline gap-3 border-l border-transparent py-2 pl-4 text-sm text-text-2 transition-colors duration-200 hover:border-text hover:text-text">
                      <span aria-hidden="true" className="tnum text-xs text-text-3">
                        {pad(i + 1)}
                      </span>
                      {t.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {aside ? <div className="mt-10">{aside}</div> : null}
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

/** One numbered section: thin rule, "01." counter, light heading, then the content. */
export function EditorialSection({ id, n, title, headingId, lead, children, wide }: { id: string; n: number; title: React.ReactNode; headingId?: string; lead?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  const hid = headingId ?? `${id}-h`;
  return (
    <section id={id} aria-labelledby={hid} className="scroll-mt-24 pb-12 last:pb-0 md:scroll-mt-28 md:pb-20">
      <div className="rule" />
      <div className="grid gap-x-8 gap-y-2 pt-5 md:grid-cols-[64px_minmax(0,1fr)] md:pt-7">
        <span aria-hidden="true" className="tnum text-sm text-text-3 md:pt-2">
          {pad(n)}.
        </span>
        <div className="min-w-0">
          <h2 id={hid} className="text-h1 max-w-[20ch]">
            {title}
          </h2>
          {lead ? <p className="mt-4 max-w-[60ch] text-base text-text-2 md:text-lg md:leading-relaxed">{lead}</p> : null}
          <div className={`mt-7 md:mt-10 ${wide ? "" : "max-w-[70ch]"}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}
