/** Standard top-of-page heading block for hubs and listings. */
export function PageHero({ eyebrow, title, intro, children, aside }: { eyebrow?: React.ReactNode; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-[radial-gradient(60%_100%_at_20%_0%,rgb(255_90_31/0.13),transparent_70%)]" />
      <div className="wrap relative flex items-end gap-10 pt-6 pb-5 md:pt-10 md:pb-7">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p lang="en" className="overline mb-3 text-orange">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-h1">{title}</h1>
          {intro ? <p className="mt-3 max-w-2xl text-[15px] text-text-2 md:text-base">{intro}</p> : null}
          {children}
        </div>
        {aside}
      </div>
    </header>
  );
}
