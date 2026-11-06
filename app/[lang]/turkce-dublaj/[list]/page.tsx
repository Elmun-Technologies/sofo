import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cap } from "@/components/catalog/catalog-url";
import { CollectionCard } from "@/components/catalog/collection-card";
import { CollectionItem } from "@/components/catalog/collection-item";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";
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
  const byService = new Map<string, { name: string; n: number }>();
  for (const i of list.items) for (const s of i.card.services) byService.set(s.slug, { name: s.name, n: (byService.get(s.slug)?.n ?? 0) + 1 });
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

      <div className="mx-auto max-w-site px-4 pt-3 pb-12 md:px-7 md:pt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div>
          <header>
            <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] md:text-[48px]">{list.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-text-2 md:mt-4 md:text-sm">
              <span aria-hidden="true" className="hidden size-7 items-center justify-center rounded-full bg-orange-deep text-[10px] font-extrabold text-orange md:inline-flex">
                {initials(list.author)}
              </span>
              <span>
                <span className="font-bold text-text">{list.author}</span> · updated {formatDate(list.updatedAt)}
                <span className="hidden md:inline"> · every title checked daily</span>
              </span>
            </p>
            <p className="mt-4 hidden max-w-3xl text-base leading-relaxed text-text md:block">{list.intro}</p>
          </header>

          <ChipRow className="mt-4 md:mt-5">
            <ChipLink href={path} active={!filter} scroll={false}>
              All {list.items.length}
            </ChipLink>
            <ChipLink href={`${path}?f=free`} active={filter === "free"} scroll={false}>
              Free · {list.items.filter(isFree).length}
            </ChipLink>
            <ChipLink href={`${path}?f=short`} active={filter === "short"} scroll={false}>
              Under 100 min · {list.items.filter(isShort).length}
            </ChipLink>
          </ChipRow>

          {items.length ? (
            <ol className="mt-4 space-y-3 md:mt-5 md:space-y-4">
              {items.map((item, n) => (
                <CollectionItem key={item.card.id} item={item} rank={list.items.indexOf(item) + 1} edition={e} primary={n === 0} />
              ))}
            </ol>
          ) : (
            <div className="mt-5">
              <EmptyState title="No titles match" action={<ChipLink href={path}>Show all {list.items.length}</ChipLink>} />
            </div>
          )}
          <p className="mt-5 text-[15px] leading-relaxed text-text-2 md:hidden">{list.intro}</p>
        </div>

        <aside className="mt-8 space-y-4 lg:mt-0">
          <section className="rounded-panel border border-line bg-surface p-5">
            <h2 className="text-[15px] font-extrabold">This list in numbers</h2>
            <p className="mt-2 text-sm text-text-2">
              {list.items.length} titles · {services.length} services · {dubCount} with confirmed {dubTerm(e.contentLang)}
            </p>
            {services.length ? <p className="mt-1 text-sm text-text-2">{services.map((s) => `${s.name} ${s.n}`).join(" · ")}</p> : null}
          </section>
          {others.length ? (
            <section className="rounded-panel border border-line bg-surface p-5">
              <h2 className="text-[15px] font-extrabold">Related lists</h2>
              <ul className="mt-2 space-y-2">
                {others.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link href={paths.list(e, l.slug)} className="text-sm font-bold text-text">
                      {l.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {others.length ? (
        <section className="mx-auto max-w-site px-4 pb-12 md:px-7" aria-labelledby="more-collections">
          <h2 id="more-collections" className="mb-4 text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
            More collections
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
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
