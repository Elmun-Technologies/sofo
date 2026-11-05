import { OutboundLink } from "@/components/outbound-link";
import { buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink } from "@/components/ui/chip";
import { ServiceLogo } from "@/components/ui/service-logo";
import { paths, type Edition } from "@/lib/editions";
import { formatPrice } from "@/lib/format";
import { dubTerm } from "@/lib/lang";
import type { ServicePageData } from "@/lib/queries/catalog-pages";
import { serviceStyle } from "@/lib/services";
import { cap, catalogHref } from "./catalog-url";

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

/** Service header: logo, name, counts, price, quick filters, outbound "Go to …". */
export function ServiceHero({ edition: e, data }: { edition: Edition; data: ServicePageData }) {
  const s = data.service;
  const st = data.stats;
  const price = formatPrice(s.priceFrom, s.currency);
  const tint = serviceStyle(s.slug).fg;
  const chips = [
    { href: paths.service(e, s.slug), label: "All", active: true },
    { href: catalogHref(e.routes.movies, { service: s.slug, audio: "dub" }), label: `${cap(dubTerm(e.contentLang))} only` },
    { href: catalogHref(e.routes.movies, { service: s.slug }), label: "Movies" },
    { href: catalogHref(e.routes.series, { service: s.slug }), label: "Series" },
    { href: catalogHref(e.routes.anime, { service: s.slug }), label: "Anime" },
  ];

  return (
    <section className="mx-auto max-w-site px-4 pt-4 md:px-7 md:pt-6">
      <div
        className="flex flex-col gap-5 rounded-hero border border-line px-5 py-5 md:flex-row md:items-center md:gap-7 md:px-7 md:py-7"
        style={{ background: `radial-gradient(90% 160% at 0% 0%, color-mix(in srgb, ${tint} 22%, transparent) 0%, #15151b 60%)` }}
      >
        <div className="flex min-w-0 grow items-center gap-4 md:gap-6">
          <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={72} className="md:hidden" />
          <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={96} className="hidden md:block" />
          <div className="min-w-0">
            <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] md:text-[44px]">
              {s.name} in {e.countryName}
            </h1>
            <p className="mt-1.5 text-[13px] text-text-2 md:text-[15px]">
              {fmt(st.titles)} titles · {fmt(st.dub)} with Turkish dub<span className="hidden md:inline"> · {fmt(st.sub)} with Turkish subtitles</span>
              {price ? (s.priceFrom === 0 ? " · free" : ` · from ${price} / month`) : ""}
              {s.hasAdsTier ? " · ad-supported plan" : ""}
            </p>
            <nav aria-label={`${s.name} shortcuts`} className="mt-4 hidden flex-wrap gap-2 md:flex">
              {chips.map((c) => (
                <ChipLink key={c.label} href={c.href} active={c.active}>
                  {c.label}
                </ChipLink>
              ))}
            </nav>
          </div>
        </div>
        {s.homeUrl ? (
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <OutboundLink
              href={s.homeUrl}
              service={s.slug}
              title={`${s.name} (service page)`}
              country={e.country}
              lang={e.contentLang}
              className={buttonClass("primary")}
            >
              Go to {s.name} ↗
            </OutboundLink>
            {data.lastCheckedAt ? <CheckedAt at={data.lastCheckedAt} className="md:text-right" /> : null}
          </div>
        ) : null}
      </div>
      <nav aria-label={`${s.name} shortcuts`} className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden">
        {chips.map((c) => (
          <ChipLink key={c.label} href={c.href} active={c.active}>
            {c.label}
          </ChipLink>
        ))}
      </nav>
    </section>
  );
}
