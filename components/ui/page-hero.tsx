/** Standard top-of-page heading block for hubs and listings. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: React.ReactNode; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mx-auto max-w-site px-4 pt-5 pb-4 md:px-7 md:pt-8 md:pb-6">
      {eyebrow ? <p lang="en" className="mb-2 text-xs font-extrabold tracking-[0.12em] text-orange uppercase">{eyebrow}</p> : null}
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em] md:text-[44px]">{title}</h1>
      {intro ? <p className="mt-3 max-w-3xl text-[15px] text-text-2 md:text-base">{intro}</p> : null}
      {children}
    </header>
  );
}
