import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroSearch } from "@/components/catalog/hero-search";
import { KidsRow, ParentSettings } from "@/components/catalog/kids-settings";
import { PosterStack } from "@/components/catalog/poster-stack";
import { ArrowRightIcon, ShieldCheckIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getEdition, paths } from "@/lib/editions";
import { langName } from "@/lib/lang";
import { getKidsPage } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/cocuk">): Promise<Metadata> {
  const e = getEdition((await params).lang);
  if (!e) return {};
  const path = e.routes.kids;
  return {
    title: `Kids — cartoons in ${langName(e.contentLang)} on official services`,
    description: `Cartoons and family movies you can watch legally in ${e.countryName}, with ${langName(e.contentLang)} dub shown only when the service confirms it. Netflix, Disney+, Prime Video, tabii and more.`,
    alternates: buildAlternates(path, { [e.hreflang]: path }),
  };
}

const TILES = ["kids-dub", "kids-short", "kids-series", "kids-services"] as const;

export default async function KidsPage({ params }: PageProps<"/[lang]/cocuk">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  const data = await getKidsPage(e);
  const lang = langName(e.contentLang);
  const tileCopy = [
    { big: String(data.counts.dub), title: `In ${lang}`, sub: "dub confirmed", dot: "bg-dub" },
    { big: String(data.counts.short), title: "Short & sweet", sub: "under 100 min", dot: null },
    { big: String(data.counts.series), title: "Series", sub: "episode by episode", dot: null },
    { big: String(data.byService.length), title: "Services", sub: "all official", dot: "bg-available" },
  ];

  return (
    <>
      <header className="wrap pt-6 pb-8 md:pt-12 md:pb-14">
        <div className="flex items-end justify-between gap-12">
          <div className="min-w-0 flex-1">
            <p className="tag">
              <ShieldCheckIcon className="size-3.5 text-available" />
              sofo kids
            </p>
            <h1 className="text-display mt-6 max-w-[14ch] md:mt-8">
              Cartoons in {lang}. <span className="text-text-3">Only official services.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] text-text-2 md:mt-6 md:text-base">
              Every title here plays on a legal service in {e.countryName}. {lang} audio is shown only when the service confirms it — no pirate
              sites, no surprises.
            </p>
            <HeroSearch action={e.routes.search} label="Search a cartoon" placeholder="Search a cartoon…" className="mt-6 max-w-[560px] md:mt-8" />
          </div>
          <PosterStack cards={data.hero} />
        </div>
      </header>

      <section className="wrap py-6 md:py-10" aria-labelledby="pick">
        <div className="rule mb-6 md:mb-8" />
        <SectionHeader id="pick" title="Pick what to watch" sub="Jump straight to a shelf" />
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {TILES.map((id, i) => {
            const t = tileCopy[i]!;
            return (
              <li key={id}>
                <Link href={`#${id}`} className="card card-hover group flex h-full min-h-[148px] flex-col justify-between gap-6 p-4 md:min-h-[200px] md:p-6">
                  <span className="flex items-start justify-between gap-3">
                    <span className="numeral">{t.big}</span>
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-3 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset group-hover:bg-text group-hover:text-ink group-hover:ring-transparent"
                    >
                      <ArrowRightIcon className="size-4 rotate-90" />
                    </span>
                  </span>
                  <span>
                    <span className="flex items-center gap-2 text-[15px] font-semibold md:text-base">
                      {t.dot ? <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${t.dot}`} /> : null}
                      {t.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-3 md:text-[13px]">{t.sub}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {data.counts.total === 0 ? (
        <div className="wrap py-10">
          <EmptyState title="No kids titles yet">We add titles as soon as a service in {e.countryName} confirms them.</EmptyState>
        </div>
      ) : (
        <>
          <KidsRow id="kids-dub" title={`Family favourites in ${lang}`} cards={data.favourites} edition={e} href={e.routes.dubHub} />
          <section className="wrap py-4 md:py-6">
            <ParentSettings langLabel={lang} myListHref={e.routes.myList} />
          </section>
          <KidsRow id="kids-short" title="Short & sweet" sub="Under 100 minutes" cards={data.short} edition={e} />
          <KidsRow id="kids-series" title="Series for kids" cards={data.series} edition={e} />
          <div id="kids-services" className="scroll-mt-24">
            {data.byService.map((s) => (
              <KidsRow key={s.slug} title={`Kids on ${s.name}`} sub={`${lang} dub first`} cards={s.cards} edition={e} href={paths.service(e, s.slug)} />
            ))}
          </div>
        </>
      )}
      <div className="pb-10 md:pb-16" />
    </>
  );
}
