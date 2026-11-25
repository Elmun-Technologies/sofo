import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, TelegramIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { AlertButton } from "@/components/value/alert-button";
import { hrefWith, one, ToggleChip } from "@/components/value/filters";
import { SectionHead, ValueHero } from "@/components/value/layout";
import { StageTimeline, stageLabel, stageState } from "@/components/value/stage-timeline";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { formatDate } from "@/lib/format";
import { langName } from "@/lib/lang";
import { getReleaseTracker, type TrackedTitle } from "@/lib/queries/value-pages";
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
  const total = months.reduce((n, m) => n + m.titles.length, 0);

  return (
    <>
      <ValueHero
        tags={
          <>
            <span className="tag">Release tracker</span>
            <span className="tag tnum">
              {total} {total === 1 ? "title" : "titles"} tracked
            </span>
          </>
        }
        title={
          <>
            Coming to streaming <span className="text-text-3">in {e.countryName}</span>
          </>
        }
        intro={<>From the cinema to your sofa — and when the {dubLabel} arrives.</>}
        aside={
          <ul aria-label="How to read the dates" className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-2.5 text-[13px] leading-5 text-text-2 lg:grid-cols-1">
            <Key mark={<CheckIcon className="size-3 stroke-[3]" />} className="bg-surface-3 text-text-2" label="Already happened" />
            <Key mark={<span className="size-1.5 rounded-full bg-ink" />} className="bg-white" label="Confirmed date" />
            <Key mark="~" className="text-leaving ring-1 ring-leaving ring-inset" label="Our estimate" />
            <Key mark={null} className="ring-1 ring-hairline-strong ring-inset" label="Not announced" />
          </ul>
        }
      >
        <ChipRow>
          <ChipLink href={hrefWith(base, current, { tip: null })} active={!type} scroll={false}>
            All
          </ChipLink>
          <ChipLink href={hrefWith(base, current, { tip: e.segments.movie })} active={type === "movie"} scroll={false}>
            Movies
          </ChipLink>
          <ChipLink href={hrefWith(base, current, { tip: e.segments.tv })} active={type === "tv"} scroll={false}>
            Series
          </ChipLink>
          <span aria-hidden="true" className="mx-1 w-px shrink-0 self-stretch bg-hairline-strong" />
          <ToggleChip href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} dot="bg-dub">
            Only {dubLabel}
          </ToggleChip>
        </ChipRow>
      </ValueHero>

      {months.length === 0 ? (
        <div className="wrap py-10 md:py-16">
          <EmptyState title="Nothing tracked for this filter yet">We add titles as soon as a studio or service announces a date.</EmptyState>
        </div>
      ) : (
        <>
          {/* Month overview: one bento cell per month, each jumps to its list */}
          <nav aria-label="Months" className="wrap pt-6 md:pt-8">
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0">
              {months.map((m) => (
                <li key={m.month} className="w-[168px] shrink-0 md:w-auto">
                  <a href={`#m-${m.month}`} className="card card-hover flex h-full flex-col p-4 md:p-6">
                    <span className="text-[13px] leading-5 text-text-2 md:text-sm">
                      <span className="md:hidden">{monthName(m.month, "short")}</span>
                      <span className="max-md:hidden">{monthName(m.month, "long")}</span>
                    </span>
                    <span className="tnum mt-4 text-[40px] leading-none font-normal tracking-[-0.05em] md:mt-8 md:text-[56px]">{m.titles.length}</span>
                    <span className="tnum mt-2 flex items-center gap-1.5 text-xs leading-5 text-text-3 md:text-[13px]">
                      {m.titles.length === 1 ? "arrival" : "arrivals"}
                      <span aria-hidden="true">·</span>
                      {m.dubs > 0 ? <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" /> : null}
                      {m.dubs} {m.dubs === 1 ? "dub" : "dubs"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="wrap">
            {months.map((m) => (
              <section key={m.month} id={`m-${m.month}`} aria-labelledby={`h-${m.month}`} className="scroll-mt-24 pt-12 md:pt-20">
                <SectionHead
                  id={`h-${m.month}`}
                  title={monthName(m.month, "long")}
                  sub="Sorted by next step"
                  action={
                    <span className="tag tnum">
                      {m.titles.length} {m.titles.length === 1 ? "title" : "titles"}
                    </span>
                  }
                />
                <ul className="flex flex-col gap-2 md:gap-3">
                  {m.titles.map((t) => (
                    <li key={t.card.id}>
                      <TrackedRow t={t} edition={e} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <div className="wrap grid grid-cols-1 gap-2 pt-12 pb-14 md:gap-3 md:pt-20 md:pb-24 lg:grid-cols-2">
        <section className="panel p-6 md:p-8">
          <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full text-lg text-leaving ring-1 ring-leaving/50 ring-inset">
            ~
          </span>
          <h2 className="text-h2 mt-6">How we estimate dates</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-text-2">
            Confirmed dates come from the services and studios. When nothing is announced, we show “~” with the usual gap between cinema, digital and subscription for that
            studio — the source is noted on each stage. We change it as soon as a real date appears.
          </p>
        </section>
        <section className="panel flex flex-col p-6 md:p-8">
          <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full ring-1 ring-hairline-strong ring-inset">
            <TelegramIcon className="size-5" />
          </span>
          <h2 className="text-h2 mt-6">Never miss a release</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-text-2">Follow a title and get one message when it lands — on Telegram or email.</p>
          <div className="mt-auto pt-6">
            <ButtonLink href={`${e.routes.myList}#alerts`} size="lg" className="max-sm:w-full">
              Connect Telegram
            </ButtonLink>
          </div>
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

function Key({ mark, label, className }: { mark: React.ReactNode; label: string; className: string }) {
  return (
    <li className="flex items-center gap-2.5 whitespace-nowrap">
      <span aria-hidden="true" className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[13px] leading-none font-medium ${className}`}>
        {mark}
      </span>
      {label}
    </li>
  );
}

/** One tracked title: the next step as a date, then the full path cinema → digital → subscription → dub. */
function TrackedRow({ t, edition }: { t: TrackedTitle; edition: Edition }) {
  const { card, next } = t;
  const href = paths.title(edition, card.type, card.slug);
  const estimate = stageState(next) === "estimate";
  // Estimates never show a day: month only, always with "~".
  const when = estimate
    ? `~ ${formatDate(next.date!, { month: "short", timeZone: "UTC" })}`
    : formatDate(next.date!, { day: "numeric", month: "short", timeZone: "UTC" });
  const step = stageLabel(next.stage, edition.contentLang, card.type);
  const meta = [card.type === "tv" ? "Series" : "Movie", card.isAnimation ? "animation" : null, card.year].filter(Boolean).join(" · ");
  const saved = { id: card.id, type: card.type, slug: card.slug, name: card.name, posterPath: card.posterPath, year: card.year };
  const hasEstimate = t.stages.some((s) => s.isEstimate && !s.past);

  return (
    <article className="card p-4 md:p-6 lg:flex lg:gap-8">
      {/* Next step — the date this month is about */}
      <div className="w-[168px] shrink-0 border-r border-hairline pr-6 max-lg:hidden">
        <p className={`tnum text-[40px] leading-none font-normal tracking-[-0.05em] whitespace-nowrap ${estimate ? "text-leaving" : ""}`}>{when}</p>
        <p className="mt-3 text-sm leading-5 font-medium">{step}</p>
        <p className="mt-0.5 text-[13px] leading-5 text-text-3">{[next.service, estimate ? "estimate" : "confirmed"].filter(Boolean).join(" · ")}</p>
      </div>

      <div className="flex min-w-0 flex-1 gap-4 md:gap-6">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="w-12 shrink-0 self-start md:w-[88px]">
          <PosterImage path={card.posterPath} alt="" sizes="88px" className="max-md:rounded-[8px]" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] leading-6 font-medium tracking-[-0.02em] md:text-[22px] md:leading-7">
                <Link href={href} className="hover:text-text md:block md:truncate">
                  {card.name}
                </Link>
              </h3>
              <p className="tnum mt-0.5 text-[13px] leading-5 text-text-3 md:mt-1 md:text-sm">{meta}</p>
              <p className="tnum mt-1 text-[13px] leading-5 lg:hidden">
                <span className="text-text-3">Next · </span>
                {step} <span className={estimate ? "text-leaving" : "text-text"}>{when}</span>
              </p>
            </div>
            <AlertButton title={saved} alert="release" label="Notify me" activeLabel="Following" variant="secondary" size="sm" className="max-md:hidden" />
          </div>
          <div className="mt-5 max-md:-ml-16 md:mt-7">
            <StageTimeline stages={t.stages} editionLang={edition.contentLang} type={card.type} />
          </div>
          {hasEstimate ? <p className="mt-4 text-xs leading-5 text-text-3 max-md:-ml-16">“~” = our estimate from the studio&apos;s usual window</p> : null}
          <AlertButton title={saved} alert="release" label="Notify me" activeLabel="Following" variant="secondary" className="mt-4 w-[calc(100%+64px)] max-md:-ml-16 md:hidden" />
        </div>
      </div>
    </article>
  );
}
