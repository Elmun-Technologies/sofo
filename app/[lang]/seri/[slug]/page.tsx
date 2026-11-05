import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { OutboundLink } from "@/components/outbound-link";
import { ChipLink } from "@/components/ui/chip";
import { CheckedAt } from "@/components/ui/checked-at";
import { JsonLd } from "@/components/ui/json-ld";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { AddAllButton, AlertButton } from "@/components/value/alert-button";
import { hrefWith, one } from "@/components/value/filters";
import { LangBadges, ServiceLine, WatchButton } from "@/components/value/watch";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { formatRuntime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { dubTerm, langName } from "@/lib/lang";
import { coveringServices, getFranchisePage } from "@/lib/queries/value-pages";
import { buildAlternates } from "@/lib/seo/hreflang";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

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
  const savedAll = ordered.map((i) => ({ id: i.card.id, type: i.card.type, slug: i.card.slug, name: i.card.name, posterPath: i.card.posterPath, year: i.card.year }));
  const latest = [...parts].sort((a, b) => (b.card.year ?? 0) - (a.card.year ?? 0))[0]!;
  const site = siteUrl();

  return (
    <>
      {/* ── Hero ── */}
      <header className="mx-auto max-w-site px-4 pt-4 md:px-7 md:pt-6">
        <div className="relative overflow-hidden rounded-[20px] bg-surface md:rounded-hero">
          {backdrop ? (
            <Image src={backdrop} alt="" fill priority sizes="(max-width: 768px) 100vw, 1360px" className="object-cover object-right md:left-auto md:w-[72%]" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent md:bg-gradient-to-r md:from-ink md:via-ink/90 md:via-45% md:to-ink/10" />
          <div className="relative flex min-h-[200px] flex-col justify-end p-4 md:min-h-[332px] md:max-w-[720px] md:justify-center md:p-9">
            <p lang="en" className="text-[11px] font-extrabold tracking-[0.12em] text-leaving uppercase md:text-[13px]">
              <span className="hidden md:inline">Franchise · </span>
              {counts.join(" · ")}
            </p>
            <h1 className="mt-1.5 text-[24px] leading-[1.1] font-extrabold tracking-[-0.03em] md:mt-3 md:text-[52px] md:leading-[1.02]">
              {data.name}: watch order<span className="hidden md:inline"> and where to stream every part</span>
            </h1>
            <p className="mt-4 hidden text-base text-text md:block">{summary}</p>
            <div className="mt-5 hidden gap-2 md:flex">
              <OrderChips base={base} story={story} hasStoryOrder={hasStoryOrder} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 md:hidden">
          <OrderChips base={base} story={story} hasStoryOrder={hasStoryOrder} />
        </div>
      </header>

      <div className="mx-auto grid max-w-site grid-cols-1 gap-6 px-4 pt-5 pb-12 md:px-7 md:pt-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-7">
        <div className="min-w-0">
          <section aria-labelledby="parts">
            <div className="mb-3.5 hidden items-baseline gap-3 md:flex">
              <h2 id="parts" className="text-2xl font-extrabold tracking-[-0.02em]">
                {movies.length > 0 ? "Movies" : "Watch order"}
              </h2>
              {totalMin ? <span className="text-sm text-text-2">{formatRuntime(totalMin)} in total</span> : null}
              <span className="text-sm text-text-3">· {story ? "story order" : "release order"}</span>
            </div>
            <ol className="relative flex flex-col gap-2.5 md:gap-3">
              {parts.map((it, i) => (
                <PartRow key={it.card.id} item={it} n={i + 1} edition={e} primary={i === 0} last={i === parts.length - 1} />
              ))}
            </ol>
          </section>

          {series.length > 0 && movies.length > 0 ? (
            <section className="mt-8">
              <h2 className="mb-3 text-2xl font-extrabold tracking-[-0.02em]">Series</h2>
              <ul className="flex flex-col gap-2.5">
                {series.map((it) => (
                  <li key={it.card.id} className="flex items-center gap-3 rounded-card bg-surface p-3">
                    {it.best ? <ServiceLogo slug={it.best.serviceSlug} name={it.best.serviceName} logoPath={it.best.logoPath} size={30} /> : null}
                    <div className="min-w-0 grow">
                      <Link href={paths.title(e, it.card.type, it.card.slug)} className="block truncate font-extrabold">
                        {it.card.name}
                      </Link>
                      <p className="text-xs text-text-2">{it.card.year}</p>
                    </div>
                    {it.best ? <LangBadges audio={it.best.audio} subtitle="unknown" edition={e} /> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {shorts.length > 0 ? (
            <section className="mt-8">
              <h2 className="mb-2 text-2xl font-extrabold tracking-[-0.02em]">Shorts</h2>
              <p className="text-[15px] text-text-2">
                {shorts.map((s, i) => (
                  <span key={s.card.id}>
                    {i > 0 ? " · " : ""}
                    <Link href={paths.title(e, s.card.type, s.card.slug)} className="text-text-2">
                      {s.card.name}
                      {s.card.year ? ` (${s.card.year})` : ""}
                    </Link>
                  </span>
                ))}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          {cover.services.length > 0 ? (
            <section className="rounded-panel bg-orange-deep p-5 md:p-6">
              <p lang="en" className="hidden text-xs font-extrabold tracking-[0.1em] text-orange uppercase md:block">
                Watch {cover.covered === parts.length ? `all ${parts.length}` : `${cover.covered} of ${parts.length}`} {nounParts}
              </p>
              <h2 className="mt-2 hidden text-[26px] leading-tight font-extrabold md:block">{coverText}</h2>
              <p className="text-[15px] md:mt-2">
                <strong className="font-extrabold md:hidden">{coverText} </strong>
                <span className="md:hidden">cover {cover.covered === parts.length ? `all ${parts.length}` : `${cover.covered} of ${parts.length}`} {nounParts}</span>
                <span className="hidden md:inline">
                  {cover.services.length === 1 ? "This service covers" : `These ${cover.services.length} cover`}{" "}
                  {cover.covered === parts.length ? `all ${parts.length}` : `${cover.covered} of ${parts.length}`} {nounParts}
                </span>
                {cover.covered === parts.length ? " — no rentals needed." : "."}
              </p>
              <AddAllButton titles={savedAll} label="Add the whole franchise to My list" className="mt-4 hidden w-full md:inline-flex" />
            </section>
          ) : null}

          <section className="hidden rounded-panel border border-line-soft bg-surface p-5 md:block">
            <h2 className="font-extrabold">What&apos;s next for {data.name}?</h2>
            <p className="mt-2 text-sm text-text-2">We&apos;ll tell you the moment a new part is dated — and when it gets {dubTerm(e.contentLang)}.</p>
            <AlertButton
              title={{ id: latest.card.id, type: latest.card.type, slug: latest.card.slug, name: latest.card.name, posterPath: latest.card.posterPath, year: latest.card.year }}
              alert="release"
              label="Notify me"
              activeLabel="✓ Notifying"
              className="mt-4 w-full"
            />
          </section>

          {data.others.length > 0 ? (
            <section className="hidden rounded-panel border border-line-soft bg-surface p-5 md:block">
              <h2 className="font-extrabold">More franchises</h2>
              <ul className="mt-2.5 flex flex-col gap-2">
                {data.others.map((f) => (
                  <li key={f.slug}>
                    <Link href={paths.franchise(e, f.slug)} className="text-[15px] font-bold">
                      {f.name} →
                    </Link>
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

function OrderChips({ base, story, hasStoryOrder }: { base: string; story: boolean; hasStoryOrder: boolean }) {
  return (
    <>
      <ChipLink href={hrefWith(base, {}, {})} active={!story} scroll={false}>
        Release order
      </ChipLink>
      <ChipLink href={hrefWith(base, {}, { sira: "hikaye" })} active={story} scroll={false}>
        Story order{hasStoryOrder ? "" : " (same)"}
      </ChipLink>
    </>
  );
}

/** One part: number tile/poster, connector line, where to watch + dub status. */
function PartRow({ item, n, edition, primary, last }: { item: Item; n: number; edition: Edition; primary: boolean; last: boolean }) {
  const href = paths.title(edition, item.card.type, item.card.slug);
  const best = item.best;
  const meta = [item.card.year, formatRuntime(item.runtimeMin)].filter(Boolean).join(" · ");
  return (
    <li className="relative">
      {/* progress connector */}
      {!last ? <span aria-hidden="true" className="absolute top-full left-[34px] z-0 h-2.5 w-0.5 bg-orange/50 md:left-[63px] md:h-3" /> : null}
      <div className="relative flex items-center gap-3.5 rounded-card border border-line-soft bg-surface p-2.5 md:gap-5 md:rounded-panel md:p-3.5">
        <Link href={href} className="relative w-12 shrink-0 md:w-[98px]" aria-label={item.card.name}>
          {item.card.posterPath ? (
            <>
              <PosterImage path={item.card.posterPath} alt="" sizes="98px" className="hidden md:block" />
              <NumberTile n={n} className="md:hidden" />
            </>
          ) : (
            <NumberTile n={n} name={item.card.name} />
          )}
        </Link>
        <div className="min-w-0 grow">
          <p lang="en" className="hidden text-xs font-extrabold tracking-[0.06em] text-leaving uppercase md:block">
            Part {n}
          </p>
          <Link href={href} className="block truncate text-base font-extrabold md:mt-1 md:text-[22px] md:tracking-[-0.01em]">
            {item.card.name}
          </Link>
          <p className="mt-0.5 hidden text-sm text-text-2 md:block">{meta}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-text-2 md:hidden">
            {best ? <ServiceLogo slug={best.serviceSlug} name={best.serviceName} logoPath={best.logoPath} size={16} /> : null}
            {[best?.serviceName ?? "Not streaming", item.card.year].filter(Boolean).join(" · ")}
          </p>
          {best ? (
            <div className="mt-1.5 md:mt-2">
              <LangBadges audio={best.audio} subtitle={best.subtitle} edition={edition} />
            </div>
          ) : null}
        </div>
        <div className="hidden w-[244px] shrink-0 md:block">
          {best ? (
            <>
              <ServiceLine option={best} />
              <WatchButton option={best} title={item.card.name} edition={edition} label="Watch" variant={primary ? "primary" : "secondary"} className="mt-2.5 w-full" />
              <CheckedAt at={best.checkedAt} className="mt-1.5 block text-[11px]" />
            </>
          ) : (
            <p className="text-sm text-text-2">Not on a legal service in {edition.countryName} right now.</p>
          )}
        </div>
        {best ? (
          <OutboundLink
            href={best.url}
            service={best.serviceSlug}
            title={item.card.name}
            country={edition.country}
            lang={edition.contentLang}
            offerType={best.type}
            className="px-2 text-lg text-orange md:hidden"
          >
            <span aria-hidden="true">↗</span>
            <span className="sr-only">Watch {item.card.name} on {best.serviceName}</span>
          </OutboundLink>
        ) : null}
      </div>
    </li>
  );
}

function NumberTile({ n, name, className = "" }: { n: number; name?: string; className?: string }) {
  return (
    <span className={`flex aspect-[2/3] w-full flex-col justify-between rounded-[10px] bg-gradient-to-b from-orange-deep to-[#1a0f08] p-2 md:rounded-poster md:p-3 ${name ? "" : "items-center justify-center"} ${className}`}>
      <span className={`font-extrabold text-leaving ${name ? "text-xl md:text-[28px]" : "text-xl"}`}>{n}</span>
      {name ? <span className="hidden text-[11px] leading-tight font-extrabold md:block">{name}</span> : null}
    </span>
  );
}
