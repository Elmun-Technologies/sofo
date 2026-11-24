import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CheckedAt } from "@/components/ui/checked-at";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { AddAllButton, AlertButton } from "@/components/value/alert-button";
import { hrefWith, one, Segmented } from "@/components/value/filters";
import { ArrowLink, SectionHead } from "@/components/value/layout";
import { LangBadges, ServiceLine, WatchButton } from "@/components/value/watch";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName } from "@/lib/lang";
import { coveringServices, getFranchisePage } from "@/lib/queries/value-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

const load = cache(async (lang: string, slug: string) => {
  const edition = getEdition(lang);
  if (!edition) return null;
  const data = await getFranchisePage(edition, slug);
  return data && data.items.length > 0 ? { edition, data } : null;
});

export async function generateMetadata({ params }: PageProps<"/[lang]/seri/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const r = await load(lang, slug);
  if (!r) return {};
  const { edition, data } = r;
  const path = paths.franchise(edition, data.slug);
  return {
    title: `${data.name} watch order — where to stream every part in ${edition.countryName}`,
    description: `${data.name} in release and story order, with the legal service and ${dubTerm(edition.contentLang)} status for each part in ${edition.countryName}.`,
    alternates: buildAlternates(path, { [edition.hreflang]: path }),
  };
}

type Item = NonNullable<Awaited<ReturnType<typeof getFranchisePage>>>["items"][number];

const pad = (n: number) => String(n).padStart(2, "0");

export default async function FranchisePage({ params, searchParams }: PageProps<"/[lang]/seri/[slug]">) {
  const { lang, slug } = await params;
  const r = await load(lang, slug);
  if (!r) notFound();
  const { edition: e, data } = r;
  const sp = await searchParams;
  const story = one(sp.sira) === "hikaye";
  const base = paths.franchise(e, data.slug);

  const ordered = [...data.items].sort((a, b) => (story ? a.storyOrder - b.storyOrder : a.releaseOrder - b.releaseOrder) || a.releaseOrder - b.releaseOrder);
  const movies = ordered.filter((i) => i.kind === "main" && i.card.type === "movie");
  const series = ordered.filter((i) => i.kind === "series" || (i.kind === "main" && i.card.type === "tv"));
  const shorts = ordered.filter((i) => i.kind === "short");
  const parts = movies.length > 0 ? movies : ordered.filter((i) => i.kind !== "short");

  const dubbed = parts.filter((i) => i.options.some((o) => o.audio === "confirmed_yes")).length;
  const included = parts.filter((i) => i.options.some((o) => o.type === "subscription" || o.type === "free" || o.type === "ads")).length;
  const cover = coveringServices(parts);
  const totalMin = parts.reduce((n, i) => n + (i.runtimeMin ?? 0), 0);
  const backdrop = imageUrl(ordered.findLast((i) => i.backdropPath)?.backdropPath ?? null, "w1280");
  const hasStoryOrder = data.items.some((i) => i.storyOrder !== i.releaseOrder);
  const dubName = `${langName(e.contentLang)} dub`;
  const nounParts = movies.length > 0 ? "movies" : "parts";

  const counts = [
    movies.length ? `${movies.length} ${movies.length === 1 ? "movie" : "movies"}` : null,
    series.length ? `${series.length} series` : null,
    shorts.length ? `${shorts.length} ${shorts.length === 1 ? "short" : "shorts"}` : null,
  ].filter(Boolean);

  const summary = [
    dubbed === parts.length ? `All ${parts.length} ${nounParts} have ${dubName}` : `${dubbed} of ${parts.length} ${nounParts} have ${dubName} confirmed`,
    included === parts.length
      ? `${dubbed === parts.length ? "and all" : "all"} ${parts.length} are included in a subscription in ${e.countryName}.`
      : `${included} of ${parts.length} are included in a subscription in ${e.countryName}.`,
  ].join(", ");

  const coverText = cover.services.map((s) => s.name).join(" + ");
  const coverScope = cover.covered === parts.length ? `all ${parts.length}` : `${cover.covered} of ${parts.length}`;
  const logoOf = (slug: string) => parts.flatMap((p) => p.options).find((o) => o.serviceSlug === slug)?.logoPath ?? null;
  const savedAll = ordered.map((i) => ({ id: i.card.id, type: i.card.type, slug: i.card.slug, name: i.card.name, posterPath: i.card.posterPath, year: i.card.year }));
  const latest = [...parts].sort((a, b) => (b.card.year ?? 0) - (a.card.year ?? 0))[0]!;
  const site = siteUrl();

  const stats: { value: string; label: string; dot?: string }[] = [
    { value: pad(parts.length), label: movies.length > 0 ? (parts.length === 1 ? "movie" : "movies in order") : parts.length === 1 ? "part" : "parts in order" },
    ...(totalMin ? [{ value: formatRuntime(totalMin)!, label: "to watch them all" }] : []),
    { value: `${dubbed}/${parts.length}`, label: `${dubName} confirmed`, dot: "bg-dub" },
    { value: `${included}/${parts.length}`, label: "included in a subscription", dot: "bg-available" },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <header className="wrap pt-4 md:pt-6">
        <div className="relative isolate overflow-hidden rounded-panel bg-surface md:rounded-hero">
          {backdrop ? (
            <Image src={backdrop} alt="" fill priority sizes="(max-width: 768px) 100vw, 1360px" className="-z-10 object-cover object-[70%_20%] md:left-auto! md:w-[70%]!" />
          ) : null}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/20 md:bg-gradient-to-r md:from-ink md:via-ink/85 md:via-40% md:to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-hairline ring-inset" />

          <div className="flex min-h-[340px] flex-col justify-end p-5 md:min-h-[460px] md:max-w-[780px] md:p-12">
            <div className="mb-auto flex flex-wrap gap-2 pb-8">
              <span className="tag border-white/25 bg-black/30 text-text backdrop-blur-md">Franchise</span>
              {counts.map((c) => (
                <span key={c} className="tag tnum border-white/25 bg-black/30 text-text backdrop-blur-md">
                  {c}
                </span>
              ))}
            </div>
            <h1 className="text-display">
              {data.name}: watch order <span className="text-white/55 max-md:hidden">and where to stream every part</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-2 md:mt-5 md:text-[17px]">{summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5 md:mt-8">
              <OrderControl base={base} story={story} hasStoryOrder={hasStoryOrder} />
              <AddAllButton titles={savedAll} label="Add all to My list" className="max-sm:w-full" />
            </div>
          </div>
        </div>

        {/* The franchise in numbers */}
        <dl className={`mt-2 grid grid-cols-2 gap-2 md:mt-3 md:gap-3 ${stats.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {stats.map((s) => (
            <div key={s.label} className="card flex flex-col-reverse justify-between gap-6 p-4 md:gap-10 md:p-6">
              <dt className="flex items-center gap-1.5 text-[13px] leading-5 text-text-2 md:text-sm">
                {s.dot ? <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${s.dot}`} /> : null}
                {s.label}
              </dt>
              <dd className="tnum text-[36px] leading-none font-normal tracking-[-0.05em] whitespace-nowrap md:text-[56px]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="wrap grid grid-cols-1 gap-x-8 gap-y-12 pt-12 pb-14 md:pt-20 md:pb-24 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-x-14">
        <div className="min-w-0">
          <section aria-labelledby="parts">
            <SectionHead
              id="parts"
              title={movies.length > 0 ? "Movies" : "Watch order"}
              sub={
                <>
                  In {story ? "story order" : "release order"}
                  {totalMin ? <span className="tnum"> · {formatRuntime(totalMin)} in total</span> : null}
                </>
              }
            />
            <ol>
              {parts.map((it, i) => (
                <PartRow key={it.card.id} item={it} n={i + 1} total={parts.length} edition={e} primary={i === 0} last={i === parts.length - 1} />
              ))}
            </ol>
          </section>

          {series.length > 0 && movies.length > 0 ? (
            <section aria-labelledby="series" className="mt-12 md:mt-20">
              <SectionHead id="series" title="Series" />
              <ul className="divide-y divide-hairline">
                {series.map((it) => (
                  <li key={it.card.id} className="flex items-center gap-4 py-4">
                    {it.best ? <ServiceLogo slug={it.best.serviceSlug} name={it.best.serviceName} logoPath={it.best.logoPath} size={32} /> : null}
                    <div className="min-w-0 flex-1">
                      <Link href={paths.title(e, it.card.type, it.card.slug)} className="block truncate text-[15px] leading-6 font-medium md:text-[17px]">
                        {it.card.name}
                      </Link>
                      <p className="tnum text-[13px] leading-5 text-text-3">{[it.card.year, it.best?.serviceName].filter(Boolean).join(" · ")}</p>
                    </div>
                    {it.best ? <LangBadges audio={it.best.audio} subtitle="unknown" edition={e} className="shrink-0 justify-end" /> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {shorts.length > 0 ? (
            <section aria-labelledby="shorts" className="mt-12 md:mt-20">
              <SectionHead id="shorts" title="Shorts" />
              <ul className="flex flex-wrap gap-2">
                {shorts.map((s) => (
                  <li key={s.card.id}>
                    <Link
                      href={paths.title(e, s.card.type, s.card.slug)}
                      className="tnum inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-text-2 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset hover:bg-white/6 hover:text-text"
                    >
                      {s.card.name}
                      {s.card.year ? <span className="text-text-3">&nbsp;· {s.card.year}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-2 md:gap-3 lg:sticky lg:top-24 lg:self-start">
          {cover.services.length > 0 ? (
            <section className="panel p-6 md:p-7">
              <p lang="en" className="overline text-text-3">
                Watch {coverScope} {nounParts}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex shrink-0 -space-x-2">
                  {cover.services.map((s) => (
                    <ServiceLogo key={s.slug} slug={s.slug} name={s.name} logoPath={logoOf(s.slug)} size={44} className="ring-2 ring-surface" />
                  ))}
                </span>
                <h2 className="text-h2 min-w-0">{coverText}</h2>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-text-2">
                {cover.services.length === 1 ? "This service covers" : `These ${cover.services.length} cover`} {coverScope} {nounParts}
                {cover.covered === parts.length ? " — no rentals needed." : "."}
              </p>
            </section>
          ) : null}

          <section className="panel p-6 md:p-7">
            <h2 className="text-h3">What&apos;s next for {data.name}?</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-2">
              We&apos;ll tell you the moment a new part is dated — and when it gets <span lang={e.hreflang}>{dubTerm(e.contentLang)}</span>.
            </p>
            <AlertButton
              title={{ id: latest.card.id, type: latest.card.type, slug: latest.card.slug, name: latest.card.name, posterPath: latest.card.posterPath, year: latest.card.year }}
              alert="release"
              label="Notify me"
              activeLabel="Notifying"
              className="mt-5 w-full"
            />
          </section>

          {data.others.length > 0 ? (
            <section className="panel p-6 md:p-7">
              <h2 className="text-h3">More franchises</h2>
              <ul className="mt-3 divide-y divide-hairline">
                {data.others.map((f) => (
                  <li key={f.slug}>
                    <ArrowLink href={paths.franchise(e, f.slug)} className="w-full py-2.5 text-[15px]">
                      {f.name}
                    </ArrowLink>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${data.name} watch order (${story ? "story" : "release"} order)`,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: ordered.length,
          itemListElement: ordered.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: new URL(paths.title(e, it.card.type, it.card.slug), site).toString(),
            name: it.card.name,
          })),
        }}
      />
    </>
  );
}

function OrderControl({ base, story, hasStoryOrder }: { base: string; story: boolean; hasStoryOrder: boolean }) {
  return (
    <Segmented
      label="Order"
      className="bg-black/30 backdrop-blur-md max-sm:flex max-sm:w-full"
      options={[
        { href: hrefWith(base, {}, {}), label: "Release order", active: !story },
        { href: hrefWith(base, {}, { sira: "hikaye" }), label: `Story order${hasStoryOrder ? "" : " (same)"}`, active: story },
      ]}
    />
  );
}

/** One part of the watch order: oversized number on a connecting line, poster, facts, the legal place to watch. */
function PartRow({ item, n, total, edition, primary, last }: { item: Item; n: number; total: number; edition: Edition; primary: boolean; last: boolean }) {
  const { card, best } = item;
  const href = paths.title(edition, card.type, card.slug);
  const meta = [card.year, formatRuntime(item.runtimeMin), card.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  return (
    <li className="flex gap-4 md:gap-8">
      {/* number + progress line down to the next part */}
      <div className="flex w-9 shrink-0 flex-col items-start md:w-[84px]">
        <span aria-hidden="true" className="tnum text-[28px] leading-none font-normal tracking-[-0.05em] md:text-[64px]">
          {pad(n)}
        </span>
        {last ? null : <span aria-hidden="true" className="mt-3 ml-[3px] w-px flex-1 bg-hairline-strong md:mt-4 md:ml-1.5" />}
      </div>

      <div className={`grid min-w-0 flex-1 grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-4 md:grid-cols-[104px_minmax(0,1fr)] md:gap-x-6 xl:grid-cols-[104px_minmax(0,1fr)_248px] ${last ? "" : "mb-6 border-b border-hairline pb-6 md:mb-8 md:pb-8"}`}>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="self-start">
          <PosterImage path={card.posterPath} alt="" sizes="104px" className="max-md:rounded-[8px]" />
        </Link>

        <div className="min-w-0">
          <p lang="en" className="overline text-text-3">
            Part {n} of {total}
          </p>
          <h3 className="mt-1.5 text-[17px] leading-6 font-medium tracking-[-0.02em] md:mt-2 md:text-[26px] md:leading-8">
            <Link href={href} className="hover:text-text">
              {card.name}
            </Link>
          </h3>
          {meta ? <p className="tnum mt-1 text-[13px] leading-5 text-text-3 md:text-sm">{meta}</p> : null}
          {best ? <LangBadges audio={best.audio} subtitle={best.subtitle} edition={edition} size="long" className="mt-2.5 md:mt-4" /> : null}
        </div>

        <div className="max-xl:col-span-2 xl:self-center">
          {best ? (
            <div className="flex items-center justify-between gap-4 xl:flex-col xl:items-stretch xl:gap-3.5">
              <div className="min-w-0">
                <ServiceLine option={best} size={36} />
              </div>
              <WatchButton option={best} title={card.name} edition={edition} label="Watch" variant={primary ? "accent" : "secondary"} className="max-sm:px-4 xl:w-full" />
            </div>
          ) : (
            <p className="text-sm text-text-2">Not on a legal service in {edition.countryName} right now.</p>
          )}
          {best ? <CheckedAt at={best.checkedAt} className="mt-2.5 block xl:text-center" /> : null}
        </div>
      </div>
    </li>
  );
}
