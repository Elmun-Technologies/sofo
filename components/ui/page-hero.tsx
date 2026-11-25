/** Standard top-of-page heading block for hubs and listings. */
export function PageHero({ eyebrow, title, intro, children, aside }: { eyebrow?: React.ReactNode; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden">
      <div className="wrap relative flex items-end gap-10 pt-8 pb-6 md:pt-16 md:pb-10">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p lang="en" className="overline mb-4 text-text-3">
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
