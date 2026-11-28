import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceCompare } from "@/components/catalog/service-compare";
import { ServiceHero } from "@/components/catalog/service-hero";
import { ServiceLeaving } from "@/components/catalog/service-leaving";
import { DubBadge, NewBadge, SubBadge } from "@/components/ui/badges";
import { PosterRow } from "@/components/ui/poster-row";
import { cap, catalogHref } from "@/components/catalog/catalog-url";
import { getEdition, paths } from "@/lib/editions";
import { formatDate, formatPrice } from "@/lib/format";
import { dubTerm, langName } from "@/lib/lang";
import { getServicePage } from "@/lib/queries/catalog-pages";
import { buildAlternates } from "@/lib/seo/hreflang";

export const revalidate = 3600;
// Only the edition's core services (checked in load()); anything else under /{lang}/ 404s.
// Rendered on first request, then cached (ISR) — D1 is not reachable at build time (ADR 0002).

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
    description: `What to watch on ${s.name} in ${e.countryName}, with ${langName(e.contentLang)} audio confirmed by the service.${price ? ` Plans from ${price}/month.` : ""} New this week, top 10, leaving soon and a comparison with other services.`,
    alternates: buildAlternates(path, { [e.hreflang]: path }),
  };
}

export default async function ServicePage({ params }: PageProps<"/[lang]/[service]">) {
  const { lang, service } = await params;
  const r = await load(lang, service);
  if (!r) notFound();
  const { e, data } = r;
  const s = data.service;
  const code = e.contentLang.toUpperCase();
  const newBadge = (dub: boolean) => (
    <span className="flex gap-1">
      <NewBadge>New</NewBadge>
      {dub ? <DubBadge>{code} dub</DubBadge> : null}
    </span>
  );
  const dayMonth = (d: Date) => formatDate(d, { day: "numeric", month: "short" });
  const [newFrom, newTo] = data.newItems.length > 0 ? [dayMonth(data.newItems[data.newItems.length - 1]!.firstSeenAt), dayMonth(data.newItems[0]!.firstSeenAt)] : [];
  const newRange = newFrom ? (newFrom === newTo ? newFrom : `${newFrom} – ${newTo}`) : undefined;
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
        badge={(c) => (c.dub ? <DubBadge>{code} dub</DubBadge> : c.sub ? <SubBadge>{code} sub</SubBadge> : "none")}
      />
      <PosterRow
        title={
          <>
            <span lang={e.hreflang}>{cap(dubTerm(e.contentLang))}</span> on {s.name}
          </>
        }
        sub={`With ${langName(e.contentLang)} audio confirmed by the service`}
        cards={data.dubbed}
        edition={e}
        href={catalogHref(e.routes.movies, { service: s.slug, audio: "dub" })}
      />
      <ServiceLeaving edition={e} serviceName={s.name} items={data.leaving} />
      <ServiceCompare edition={e} data={data} />
    </>
  );
}
