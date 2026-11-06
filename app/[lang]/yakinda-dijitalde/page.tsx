import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { AlertButton } from "@/components/value/alert-button";
import { hrefWith, one } from "@/components/value/filters";
import { StageTimeline } from "@/components/value/stage-timeline";
import { getEdition, paths } from "@/lib/editions";
import { langName } from "@/lib/lang";
import { getReleaseTracker } from "@/lib/queries/value-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/yakinda-dijitalde">): Promise<Metadata> {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) return {};
  return {
    title: `Coming to streaming in ${e.countryName} — digital, subscription and ${langName(e.contentLang)} dub dates`,
    description: `When new movies and series reach rent/buy, subscription services and ${langName(e.contentLang)} dub in ${e.countryName}. Estimated dates are marked with "~".`,
    alternates: buildAlternates(e.routes.releases, { [e.hreflang]: e.routes.releases }),
  };
}

const monthName = (ym: string, style: "long" | "short") =>
  new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: style, ...(style === "long" ? { year: "numeric" } : {}), timeZone: "UTC" });

export default async function ReleasesPage({ params, searchParams }: PageProps<"/[lang]/yakinda-dijitalde">) {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) notFound();
  const sp = await searchParams;
  const tip = one(sp.tip);
  const type = tip === e.segments.movie ? "movie" : tip === e.segments.tv ? "tv" : undefined;
  const dubOnly = one(sp.dublaj) === "1";
  const current = { tip: type ? tip : undefined, dublaj: dubOnly ? "1" : undefined };
  const base = e.routes.releases;
  const { months } = await getReleaseTracker(e, { type, dubOnly });
  const dubLabel = `${langName(e.contentLang)} dub`;
  const site = siteUrl();

  return (
    <>
      <header className="mx-auto max-w-site px-4 pt-5 md:px-7 md:pt-8">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[48px]">
          Coming to streaming<span className="hidden md:inline"> in {e.countryName}</span>
        </h1>
        <p className="mt-1.5 text-[15px] text-text-2 md:mt-3 md:text-lg">
          <span className="md:hidden">Cinema → your sofa → {dubLabel}</span>
          <span className="hidden md:inline">From the cinema to your sofa — and when the {dubLabel} arrives.</span>
        </p>
        <ChipRow className="mt-4 md:mt-5">
          <ChipLink href={hrefWith(base, current, { tip: null })} active={!type} scroll={false}>
            All
          </ChipLink>
          <ChipLink href={hrefWith(base, current, { tip: e.segments.movie })} active={type === "movie"} scroll={false}>
            Movies
          </ChipLink>
          <ChipLink href={hrefWith(base, current, { tip: e.segments.tv })} active={type === "tv"} scroll={false}>
            Series
          </ChipLink>
          <ChipLink href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} scroll={false}>
            {dubOnly ? "✓ " : ""}Only {dubLabel}
          </ChipLink>
        </ChipRow>
      </header>

      {months.length === 0 ? (
        <div className="mx-auto max-w-site px-4 py-10 md:px-7">
          <EmptyState title="Nothing tracked for this filter yet">We add titles as soon as a studio or service announces a date.</EmptyState>
        </div>
      ) : (
        <>
          {/* Month overview: chips on mobile, cards on desktop */}
          <nav aria-label="Months" className="mx-auto max-w-site px-4 pt-5 md:px-7 md:pt-8">
            <ChipRow className="md:hidden">
              {months.map((m, i) => (
                <ChipLink key={m.month} href={`#m-${m.month}`} active={i === 0}>
                  {monthName(m.month, "short")} · {m.titles.length}
                </ChipLink>
              ))}
            </ChipRow>
            <ul className="hidden grid-cols-4 gap-3 md:grid">
              {months.slice(0, 4).map((m, i) => (
                <li key={m.month}>
                  <a
                    href={`#m-${m.month}`}
                    className={`block rounded-card border bg-surface px-4 py-4 hover:text-text ${i === 0 ? "border-orange" : "border-line-soft hover:border-line"}`}
                  >
                    <span className="block text-sm font-bold text-text-2">{monthName(m.month, "long")}</span>
                    <span className="mt-1 block text-[28px] leading-tight font-extrabold">{m.titles.length}</span>
                    <span className="block text-xs text-text-2">
                      {m.titles.length === 1 ? "arrival" : "arrivals"} · {m.dubs} {m.dubs === 1 ? "dub" : "dubs"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mx-auto max-w-site px-4 pt-6 md:px-7 md:pt-10">
            {months.map((m) => (
              <section key={m.month} id={`m-${m.month}`} aria-labelledby={`h-${m.month}`} className="mb-8 scroll-mt-20">
                <div className="mb-3.5 flex items-baseline gap-3">
                  <h2 id={`h-${m.month}`} className="text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
                    {monthName(m.month, "long")}
                  </h2>
                  <span className="text-sm text-text-2">Sorted by next step</span>
                </div>
                <ul className="flex flex-col gap-3">
                  {m.titles.map((t) => {
                    const href = paths.title(e, t.card.type, t.card.slug);
                    return (
                      <li key={t.card.id} className="rounded-panel border border-line-soft bg-surface p-3.5 md:p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
                          <div className="flex items-center gap-3.5 md:contents">
                            <Link href={href} className="w-11 shrink-0 md:w-24">
                              <PosterImage path={t.card.posterPath} alt={t.card.name} sizes="96px" className="rounded-[8px]! md:rounded-poster!" />
                            </Link>
                            <Link href={href} className="text-lg leading-tight font-extrabold md:hidden">
                              {t.card.name}
                            </Link>
                          </div>
                          <div className="min-w-0 grow">
                            <p className="mb-4 hidden items-baseline gap-2 md:flex">
                              <Link href={href} className="truncate text-[22px] font-extrabold tracking-[-0.01em]">
                                {t.card.name}
                              </Link>
                              <span className="shrink-0 text-sm text-text-2">
                                {t.card.type === "tv" ? "Series" : "Movie"}
                                {t.card.isAnimation ? " · animation" : ""}
                              </span>
                            </p>
                            <StageTimeline stages={t.stages} editionLang={e.contentLang} type={t.card.type} />
                          </div>
                          <div className="shrink-0 md:w-[176px]">
                            <AlertButton
                              title={{ id: t.card.id, type: t.card.type, slug: t.card.slug, name: t.card.name, posterPath: t.card.posterPath, year: t.card.year }}
                              alert="release"
                              label="Notify me"
                              activeLabel="✓ Following"
                              variant="primary"
                              className="w-full"
                            />
                            {t.stages.some((s) => s.isEstimate && !s.past) ? (
                              <p className="mt-2 hidden text-[11px] leading-snug text-text-3 md:block">“~” = our estimate from the studio&apos;s usual window</p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <div className="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 pt-2 pb-12 md:px-7 lg:grid-cols-2 lg:gap-5">
        <section className="rounded-panel border border-line-soft bg-surface p-5 md:p-6">
          <h2 className="text-lg font-extrabold">How we estimate dates</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-text-2">
            Confirmed dates come from the services and studios. When nothing is announced, we show “~” with the usual gap between cinema, digital and subscription for that
            studio — the source is noted on each stage. We change it as soon as a real date appears.
          </p>
        </section>
        <section className="rounded-panel bg-orange-deep p-5 md:p-6">
          <h2 className="text-lg font-extrabold">Never miss a release</h2>
          <p className="mt-2 text-[15px] text-text-2">Follow a title and get one message when it lands — on Telegram or email.</p>
          <Link
            href={`${e.routes.myList}#alerts`}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-button bg-orange text-base font-extrabold text-ink hover:bg-orange-hover hover:text-ink"
          >
            Connect Telegram
          </Link>
        </section>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Coming to streaming in ${e.countryName}`,
          itemListElement: months
            .flatMap((m) => m.titles)
            .map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: new URL(paths.title(e, t.card.type, t.card.slug), site).toString(),
              name: t.card.name,
            })),
        }}
      />
    </>
  );
}
