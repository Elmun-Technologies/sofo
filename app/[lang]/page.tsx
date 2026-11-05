import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroSearch } from "@/components/home/hero-search";
import { MyServices } from "@/components/home/my-services";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { LeavingBadge } from "@/components/ui/badges";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { PosterRow } from "@/components/ui/poster-row";
import { SectionHeader } from "@/components/ui/section-header";
import { getServices } from "@/lib/catalog";
import { getEdition, paths } from "@/lib/editions";
import { daysUntil } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName, localLangName, subTerm } from "@/lib/lang";
import { getHomeData } from "@/lib/queries/home";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const home = edition.routes.home;
  return {
    title: { absolute: `Türkçe dublaj filmler ve diziler hangi platformda? · sofo ${edition.countryName}` },
    description: `Netflix, Disney+, Prime Video, HBO Max, TOD, tabii ve diğer yasal platformlarda hangi film ve dizinin Türkçe dublaj ya da altyazıyla olduğunu her gün kontrol ediyoruz.`,
    alternates: buildAlternates(home, { [edition.hreflang]: home }),
  };
}

export default async function EditionHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const [data, services] = await Promise.all([getHomeData(edition), getServices(edition)]);
  const r = edition.routes;
  const L = localLangName(edition.contentLang);
  const wall = [...data.top, ...data.anime, ...data.kids].filter((c) => c.posterPath).slice(0, 20);

  const langCards = data.langCards.map((c) => ({
    ...c,
    ...{
      dub: { name: dubTerm(edition.contentLang), sub: "Dubbed on legal services", href: r.dubHub },
      sub: { name: subTerm(edition.contentLang), sub: "Original audio + subtitles", href: r.subHub },
      anime: { name: "Anime — sub or dub", sub: "Japanese & Korean animation", href: r.anime },
      kids: { name: "Kids, dubbed", sub: "Safe picks for children", href: r.kids },
    }[c.key as "dub" | "sub" | "anime" | "kids"],
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute -inset-x-16 -top-32 hidden rotate-[-8deg] grid-cols-10 gap-2.5 opacity-[0.16] md:grid">
          {[...wall, ...wall].slice(0, 40).map((c, i) => (
            <div key={i} className="relative aspect-[2/3] overflow-hidden rounded-poster">
              <Image src={imageUrl(c.posterPath)!} alt="" fill sizes="10vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,13,0.75)_0%,#0A0A0D_70%)]" />
        <div className="relative mx-auto max-w-site px-4 pt-6 pb-4 md:px-7 md:pt-24 md:pb-20 md:text-center">
          <h1 className="text-[32px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[76px]">
            Every movie. Every service.
            <br className="hidden md:block" /> <span className="text-orange max-md:text-text">Your language.</span>
          </h1>
          <p className="mx-auto mt-4 hidden max-w-2xl text-lg font-medium text-text-2 md:block">
            Search once — we check Netflix, Disney+, Prime Video and 40+ legal services to find the version you can actually understand.
          </p>
          <HeroSearch action={r.search} langLabel={L} />
          <ChipRow className="mt-4 md:justify-center">
            <ChipLink href={r.dubHub} active>
              {dubTerm(edition.contentLang).replace(/^./, (c) => c.toUpperCase())}
            </ChipLink>
            <ChipLink href={r.anime}>Anime</ChipLink>
            <ChipLink href={r.kids}>Kids</ChipLink>
            <ChipLink href={r.newLeaving}>Leaving</ChipLink>
            <ChipLink href={`${r.movies}?offer=free`}>Free</ChipLink>
            <ChipLink href={r.releases}>Coming soon</ChipLink>
          </ChipRow>
          {data.trending.length ? (
            <p className="mt-4 hidden text-sm text-text-3 md:block">
              Trending in {edition.countryName}:{" "}
              {data.trending.map((q, i) => (
                <span key={q}>
                  {i > 0 ? " · " : ""}
                  <Link href={paths.search(edition, q)} className="font-semibold text-text-2">
                    {q}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </section>

      <PosterRow title={`Top 10 in ${edition.countryName} this week`} cards={data.top} edition={edition} href={r.movies} ranked />

      {/* Watch in your language */}
      <section className="mx-auto max-w-site px-4 py-5 md:px-7 md:py-7">
        <SectionHeader title="Watch in your language" sub={`Dubbed and subtitled, on legal services in ${edition.countryName}`} />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {langCards.map((c) => (
            <li key={c.key}>
              <Link href={c.href} className="group flex h-full items-center gap-3 rounded-panel border border-line bg-surface p-4 hover:border-orange hover:text-text md:p-5">
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold md:text-lg">{c.name}</span>
                  <span className="block text-xs text-text-2 md:text-sm">
                    {c.count} titles · {c.sub}
                  </span>
                </span>
                <span className="relative hidden h-[72px] w-[92px] shrink-0 sm:block">
                  {c.cards.slice(0, 3).map((card, i) => (
                    <span key={card.id} className="absolute top-0 w-12 transition group-hover:-translate-y-0.5" style={{ left: i * 22, zIndex: 3 - i, rotate: `${(i - 1) * 6}deg` }}>
                      <PosterImage path={card.posterPath} alt="" sizes="48px" className="rounded-[8px] ring-2 ring-surface" />
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PosterRow
        title={`Just dubbed into ${langName(edition.contentLang)}`}
        cards={data.justDubbed}
        edition={edition}
        href={r.newLeaving}
        badge={() => "new-dub"}
      />

      {data.leaving ? (
        <section className="mx-auto max-w-site px-4 py-3 md:px-7">
          <Link
            href={paths.title(edition, data.leaving.type, data.leaving.slug)}
            className="flex items-center gap-4 rounded-panel border border-leaving/30 bg-gradient-to-r from-[#2A2210] to-surface p-4 hover:text-text md:p-5"
          >
            <span className="w-14 shrink-0 md:w-16">
              <PosterImage path={data.leaving.posterPath} alt="" sizes="64px" className="rounded-[8px]" />
            </span>
            <span className="min-w-0 flex-1">
              <LeavingBadge>LEAVING IN {daysUntil(data.leaving.leavingAt)} DAYS</LeavingBadge>
              <span className="mt-1.5 block text-base font-extrabold md:text-xl">
                {data.leaving.name} leaves {data.leaving.service}
              </span>
            </span>
            <span className="shrink-0 text-sm font-extrabold text-leaving">Watch now →</span>
          </Link>
        </section>
      ) : null}

      <PosterRow title="New this week" cards={data.newThisWeek} edition={edition} href={r.newLeaving} />
      <PosterRow
        title="Anime — sub or dub"
        cards={data.anime}
        edition={edition}
        href={r.anime}
        badge={(c) => (c.dub ? <span className="rounded-chip bg-dub px-2 py-0.5 text-[11px] font-extrabold">TR dub</span> : c.sub ? undefined : "none")}
      />

      <MyServices services={services} />

      <PosterRow title="For kids — in Turkish" cards={data.kids} edition={edition} href={r.kids} />

      {data.lists.length ? (
        <section className="mx-auto max-w-site px-4 py-5 md:px-7 md:py-7" id="collections">
          <SectionHeader title="Collections" href={r.collections} linkLabel="All collections" />
          <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {data.lists.map((l) => (
              <li key={l.id}>
                <Link href={paths.list(edition, l.slug)} className="group block overflow-hidden rounded-panel border border-line bg-surface hover:border-orange hover:text-text">
                  <span className="grid grid-cols-4 gap-0.5">
                    {l.items.map((it) => (
                      <PosterImage key={it.titleId} path={it.title.posterPath} alt="" sizes="90px" className="rounded-none" />
                    ))}
                  </span>
                  <span className="block p-3.5 md:p-4">
                    <span className="line-clamp-2 block text-[15px] leading-snug font-extrabold">{l.name}</span>
                    <span className="mt-1 block text-xs text-text-2">{l._count.items} titles · by {l.author}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SubscribeSection langName={langName(edition.contentLang)} />

      <section className="mx-auto max-w-site px-4 py-8 md:px-7">
        <h2 className="text-lg font-extrabold md:text-xl">Türkçe dublaj filmler ve diziler — hangi platformda?</h2>
        <details className="group mt-2 max-w-4xl text-sm leading-relaxed text-text-2">
          <summary className="cursor-pointer list-none">
            <span>
              sofo; Netflix, Disney+, Prime Video, HBO Max, TOD, tabii, Exxen ve Gain gibi Türkiye&apos;deki yasal platformları her gün kontrol eder ve
              hangi film ve dizinin Türkçe dublaj ya da altyazıyla izlenebildiğini gösterir…
            </span>
            <span className="mt-2 block font-bold text-text-2 group-open:hidden">Read more</span>
          </summary>
          <p className="mt-2">
            Dil bilgisi yalnızca platform onayladığında gösterilir; doğrulanmamışsa “Not confirmed by the service” yazarız ve asla tahmin etmeyiz. Her
            sonuçta son kontrol zamanı yer alır. Video barındırmayız; izleme her zaman resmi platformda gerçekleşir. Korsan sitelere bağlantı vermeyiz.
          </p>
        </details>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "sofo",
          url: new URL(r.home, siteUrl()).toString(),
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${new URL(r.search, siteUrl()).toString()}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}
