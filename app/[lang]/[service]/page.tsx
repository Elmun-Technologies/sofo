import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceCompare } from "@/components/catalog/service-compare";
import { ServiceHero } from "@/components/catalog/service-hero";
import { ServiceLeaving } from "@/components/catalog/service-leaving";
import { DubBadge, NewBadge, SubBadge } from "@/components/ui/badges";
import { PosterRow } from "@/components/ui/poster-row";
import { cap, catalogHref } from "@/components/catalog/catalog-url";
import { editionCodes, getEdition, paths } from "@/lib/editions";
import { formatDate, formatPrice } from "@/lib/format";
import { dubTerm, langName } from "@/lib/lang";
import { getServicePage } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";

export const revalidate = 3600;
// Only the edition's core services; anything else under /{lang}/ 404s (static routes still win).
export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang?: string } }) {
  const codes = params.lang ? [params.lang] : editionCodes();
  return codes.flatMap((lang) => (getEdition(lang)?.coreServices ?? []).map((service) => ({ lang, service })));
}

async function load(lang: string, slug: string) {
  const e = getEdition(lang);
  if (!e || !e.coreServices.includes(slug)) return null;
  const data = await getServicePage(e, slug);
  return data ? { e, data } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[service]">): Promise<Metadata> {
  const { lang, service } = await params;
  const r = await load(lang, service);
  if (!r) return {};
  const { e, data } = r;
  const s = data.service;
  const path = paths.service(e, s.slug);
  const price = formatPrice(s.priceFrom, s.currency);
  return {
    title: `${s.name} ${e.countryName}: what's on, ${cap(dubTerm(e.contentLang))} & price`,
    description: `${data.stats.titles} titles on ${s.name} in ${e.countryName}, ${data.stats.dub} with ${langName(e.contentLang)} audio confirmed by the service.${price ? ` Plans from ${price}/month.` : ""} New this week, top 10, leaving soon and a comparison with other services.`,
    alternates: buildAlternates(path, { [e.hreflang]: path }),
  };
}

export default async function ServicePage({ params }: PageProps<"/[lang]/[service]">) {
  const { lang, service } = await params;
  const r = await load(lang, service);
  if (!r) notFound();
  const { e, data } = r;
  const s = data.service;
  const newBadge = (dub: boolean) => (
    <span className="flex gap-1">
      <NewBadge>NEW</NewBadge>
      {dub ? <DubBadge>TR dub</DubBadge> : null}
    </span>
  );
  const newRange =
    data.newItems.length > 0
      ? `${formatDate(data.newItems[data.newItems.length - 1]!.firstSeenAt, { day: "numeric", month: "short" })} – ${formatDate(data.newItems[0]!.firstSeenAt, { day: "numeric", month: "short" })}`
      : undefined;
  const dubbedIds = new Set(data.newItems.filter((n) => n.card.dub).map((n) => n.card.id));

  return (
    <>
      <ServiceHero edition={e} data={data} />

      <PosterRow
        title={`New on ${s.name}`}
        sub={newRange}
        cards={data.newItems.map((n) => n.card)}
        edition={e}
        badge={(c) => newBadge(dubbedIds.has(c.id))}
        meta={(c) => (c.year ? String(c.year) : null)}
        href={e.routes.newLeaving}
      />
      <PosterRow
        title={`Top 10 on ${s.name}`}
        sub={`Most popular in ${e.countryName}`}
        cards={data.top}
        edition={e}
        ranked
        badge={(c) => (c.dub ? <DubBadge>TR dub</DubBadge> : c.sub ? <SubBadge>TR sub</SubBadge> : "none")}
      />
      <PosterRow
        title={`${cap(dubTerm(e.contentLang))} on ${s.name}`}
        sub={`${data.stats.dub} titles with ${langName(e.contentLang)} audio`}
        cards={data.dubbed}
        edition={e}
        href={catalogHref(e.routes.movies, { service: s.slug, audio: "dub" })}
      />
      <ServiceLeaving edition={e} serviceName={s.name} items={data.leaving} />
      <ServiceCompare edition={e} data={data} />
    </>
  );
}
