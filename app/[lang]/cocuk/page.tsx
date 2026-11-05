import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroSearch } from "@/components/catalog/hero-search";
import { KidsRow, ParentSettings } from "@/components/catalog/kids-settings";
import { PosterStack } from "@/components/catalog/poster-stack";
import { EmptyState } from "@/components/ui/empty-state";
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

// Playful pastel tiles (Kids board) with dark text for contrast.
const TILES = [
  { bg: "#FFE38A", id: "kids-dub" },
  { bg: "#F9A8D4", id: "kids-short" },
  { bg: "#7DD3FC", id: "kids-series" },
  { bg: "#86EFAC", id: "kids-services" },
] as const;

export default async function KidsPage({ params }: PageProps<"/[lang]/cocuk">) {
  const e = getEdition((await params).lang);
  if (!e) notFound();
  const data = await getKidsPage(e);
  const lang = langName(e.contentLang);
  const tileCopy = [
    { big: String(data.counts.dub), title: `In ${lang}`, sub: "dub confirmed" },
    { big: String(data.counts.short), title: "Short & sweet", sub: "under 100 min" },
    { big: String(data.counts.series), title: "Series", sub: "episode by episode" },
    { big: String(data.byService.length), title: "Services", sub: "all official" },
  ];

  return (
    <>
      <section className="mx-auto max-w-site px-4 pt-4 md:px-7 md:pt-6">
        <div className="flex items-center gap-8 overflow-hidden rounded-hero bg-[linear-gradient(120deg,#1d2a4a_0%,#2a2350_55%,#3a1f45_100%)] px-5 py-6 md:px-10 md:py-10">
          <div className="min-w-0 grow">
            <p className="mb-3 inline-flex rounded-chip bg-leaving px-2.5 py-0.5 text-xs font-extrabold text-ink">sofo kids</p>
            <h1 className="text-[28px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[56px]">
              Cartoons in {lang}.
              <br />
              Only official services.
            </h1>
            <p className="mt-4 hidden max-w-xl text-base text-text md:block">
              Every title here plays on a legal service in {e.countryName}. {lang} audio is shown only when the service confirms it — no pirate
              sites, no surprises.
            </p>
            <HeroSearch action={e.routes.search} label="Search a cartoon" placeholder="Search a cartoon…" className="mt-5 max-w-xl" />
          </div>
          <PosterStack cards={data.hero} />
        </div>
      </section>

      <section className="mx-auto max-w-site px-4 pt-7 md:px-7 md:pt-10" aria-labelledby="pick">
        <h2 id="pick" className="mb-3.5 text-xl font-extrabold tracking-[-0.02em] md:mb-4 md:text-2xl">
          Pick what to watch
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5">
          {TILES.map((t, i) => (
            <li key={t.id}>
              <Link
                href={`#${t.id}`}
                style={{ background: t.bg }}
                className="block rounded-panel px-4 py-4 text-ink transition hover:-translate-y-0.5 hover:text-ink md:px-6 md:py-6"
              >
                <span className="block text-[32px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">{tileCopy[i]!.big}</span>
                <span className="mt-2 block text-[15px] font-extrabold md:mt-3">{tileCopy[i]!.title}</span>
                <span className="hidden text-[13px] font-semibold text-ink/60 md:block">{tileCopy[i]!.sub}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {data.counts.total === 0 ? (
        <div className="mx-auto max-w-site px-4 py-10 md:px-7">
          <EmptyState title="No kids titles yet">We add titles as soon as a service in {e.countryName} confirms them.</EmptyState>
        </div>
      ) : (
        <>
          <KidsRow id="kids-dub" title={`Family favourites in ${lang}`} cards={data.favourites} edition={e} href={e.routes.dubHub} />
          <section className="mx-auto max-w-site px-4 pt-2 md:px-7">
            <ParentSettings langLabel={lang} myListHref={e.routes.myList} />
          </section>
          <KidsRow id="kids-short" title="Short & sweet" sub="Under 100 minutes" cards={data.short} edition={e} />
          <KidsRow id="kids-series" title="Series for kids" cards={data.series} edition={e} />
          <div id="kids-services" className="scroll-mt-20">
            {data.byService.map((s) => (
              <KidsRow key={s.slug} title={`Kids on ${s.name}`} sub={`${lang} dub first`} cards={s.cards} edition={e} href={paths.service(e, s.slug)} />
            ))}
          </div>
        </>
      )}
      <div className="pb-8" />
    </>
  );
}
