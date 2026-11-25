import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cap } from "@/components/catalog/catalog-url";
import { CollectionCard } from "@/components/catalog/collection-card";
import { CollectionItem } from "@/components/catalog/collection-item";
import { ChevronRightIcon, FilterIcon, LayersIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/section-header";
import { ServiceLogo } from "@/components/ui/service-logo";
import { getPublishedLists } from "@/lib/catalog";
import { getEdition, paths } from "@/lib/editions";
import { formatDate, initials } from "@/lib/format";
import { dubTerm } from "@/lib/lang";
import { getCollection } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

type Filter = "free" | "short";
const FILTERS: Filter[] = ["free", "short"];

// No generateStaticParams: the page reads searchParams (?f=), so it renders per request (ADR 0002).

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/turkce-dublaj/[list]">): Promise<Metadata> {
  const { lang, list: slug } = await params;
  const e = getEdition(lang);
  const list = e ? await getCollection(e, slug) : null;
  if (!e || !list) return {};
  const path = paths.list(e, list.slug);
  const filtered = !!(await searchParams).f;
  return {
    title: list.name,
    description: `${list.intro.slice(0, 150)}${list.intro.length > 150 ? "…" : ""} ${list.items.length} titles, with where to watch each one in ${e.countryName}.`,
    alternates: buildAlternates(path, { [e.hreflang]: path }),
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/[lang]/turkce-dublaj/[list]">) {
  const { lang, list: slug } = await params;
  const e = getEdition(lang);
  if (!e) notFound();
  const [list, allLists] = await Promise.all([getCollection(e, slug), getPublishedLists(e)]);
  if (!list) notFound();

  const fParam = (await searchParams).f;
  const filter = FILTERS.find((x) => x === fParam);
  const isFree = (i: (typeof list.items)[number]) => i.card.hasFree;
  const isShort = (i: (typeof list.items)[number]) => i.runtimeMin != null && i.runtimeMin < 100;
  const items = filter === "free" ? list.items.filter(isFree) : filter === "short" ? list.items.filter(isShort) : list.items;
  const path = paths.list(e, list.slug);

  // "This list in numbers"
  const byService = new Map<string, { slug: string; name: string; logoPath: string | null; n: number }>();
  for (const i of list.items) for (const s of i.card.services) byService.set(s.slug, { ...s, n: (byService.get(s.slug)?.n ?? 0) + 1 });
  const services = [...byService.values()].sort((a, b) => b.n - a.n);
  const dubCount = list.items.filter((i) => i.audio === "confirmed_yes").length;
  const others = allLists.filter((l) => l.slug !== list.slug);
  const base = siteUrl();

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: e.routes.home },
          { name: cap(dubTerm(e.contentLang)), href: e.routes.dubHub },
          { name: "Collections", href: e.routes.collections },
          { name: list.name },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: list.name,
          description: list.intro,
          url: new URL(path, base).toString(),
          numberOfItems: list.items.length,
          itemListElement: list.items.map((i, n) => ({
            "@type": "ListItem",
            position: n + 1,
            url: new URL(paths.title(e, i.card.type, i.card.slug), base).toString(),
            name: i.card.name,
          })),
        }}
      />

      <header className="wrap pt-6 pb-7 md:pt-10 md:pb-12">
        <p className="tag">
          <LayersIcon className="size-3.5" />
          Collection
        </p>
        <h1 lang={e.hreflang} className="text-display mt-5 max-w-[20ch] md:mt-7">
          {list.name}
        </h1>
        <p lang={e.hreflang} className="mt-5 max-w-2xl text-base leading-relaxed text-text-2 md:mt-7 md:text-lg">
          {list.intro}
        </p>
        <p className="mt-5 flex items-center gap-3 text-[13px] text-text-2 md:mt-7 md:text-sm">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-text/8 text-[11px] font-semibold text-text">
            {initials(list.author)}
          </span>
          <span className="tnum">
            <span className="font-semibold text-text">{list.author}</span> · updated {formatDate(list.updatedAt)}
            <span className="hidden sm:inline"> · every title checked daily</span>
          </span>
        </p>
      </header>

      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 pb-12 md:pb-20 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <ChipRow className="mb-5 md:mb-7">
            <ChipLink href={path} active={!filter} scroll={false}>
              All <span className="tnum opacity-60">{list.items.length}</span>
            </ChipLink>
            <ChipLink href={`${path}?f=free`} active={filter === "free"} scroll={false}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-free" />
              Free <span className="tnum opacity-60">{list.items.filter(isFree).length}</span>
            </ChipLink>
            <ChipLink href={`${path}?f=short`} active={filter === "short"} scroll={false}>
              Under 100 min <span className="tnum opacity-60">{list.items.filter(isShort).length}</span>
            </ChipLink>
          </ChipRow>

          {items.length ? (
            <ol className="border-b border-hairline-strong">
              {items.map((item, n) => (
                <CollectionItem key={item.card.id} item={item} rank={list.items.indexOf(item) + 1} edition={e} primary={n === 0} />
              ))}
            </ol>
          ) : (
            <EmptyState
              icon={<FilterIcon className="size-5" />}
              title="No titles match"
              action={
                <ButtonLink href={path} variant="primary">
                  Show all {list.items.length}
                </ButtonLink>
              }
            >
              Nothing in this collection fits that filter right now.
            </EmptyState>
          )}
        </div>

        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:sticky xl:top-36 xl:h-fit xl:grid-cols-[minmax(0,1fr)]">
          <section className="panel p-5 md:p-6">
            <h2 className="text-h3">This list in numbers</h2>
            <dl className="mt-5 grid grid-cols-3 gap-3">
              {[
                { n: list.items.length, label: "titles" },
                { n: services.length, label: services.length === 1 ? "service" : "services" },
                { n: dubCount, label: `confirmed ${dubTerm(e.contentLang)}`, local: true, dot: true },
              ].map((s) => (
                <div key={s.label} className="flex flex-col-reverse justify-end gap-2">
                  <dt className="text-xs leading-snug text-text-3">
                    {s.dot ? <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 rounded-full bg-dub align-middle" /> : null}
                    <span lang={s.local ? e.hreflang : undefined}>{s.label}</span>
                  </dt>
                  <dd className="text-[40px] leading-[0.9] font-normal tracking-[-0.05em]">{s.n}</dd>
                </div>
              ))}
            </dl>
            {services.length ? (
              <ul className="mt-5 divide-y divide-hairline border-t border-hairline">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link href={paths.service(e, s.slug)} className="flex items-center gap-3 py-2.5 text-sm text-text-2 hover:text-text">
                      <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={24} />
                      <span className="min-w-0 flex-1 truncate font-medium text-text">{s.name}</span>
                      <span className="tnum text-xs text-text-3">
                        {s.n} title{s.n === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          {others.length ? (
            <section className="panel p-5 md:p-6">
              <h2 className="text-h3">Related lists</h2>
              <ul lang={e.hreflang} className="mt-3 divide-y divide-hairline">
                {others.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link href={paths.list(e, l.slug)} className="group flex items-center gap-3 py-3 text-sm leading-snug font-medium text-text-2 hover:text-text">
                      <span className="min-w-0 flex-1">{l.name}</span>
                      <ChevronRightIcon className="size-4 shrink-0 text-text-3 transition duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {others.length ? (
        <section className="wrap pb-14 md:pb-24" aria-labelledby="more-collections">
          <div className="rule mb-6 md:mb-8" />
          <SectionHeader id="more-collections" title="More collections" sub="Picked by our editors" href={e.routes.collections} linkLabel="All collections" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {others.slice(0, 4).map((l) => (
              <li key={l.id}>
                <CollectionCard edition={e} list={l} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
