import { ArrowUpRightIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { buttonClass } from "@/components/ui/button";
import { CheckedAt } from "@/components/ui/checked-at";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { ServiceLogo } from "@/components/ui/service-logo";
import { paths, type Edition } from "@/lib/editions";
import { formatPrice } from "@/lib/format";
import { dubTerm, langName } from "@/lib/lang";
import type { ServicePageData } from "@/lib/queries/catalog-pages";
import { cap, catalogHref } from "./catalog-url";

/** Service header: identity, outbound "Go to …", the four numbers that matter, quick filters. */
export function ServiceHero({ edition: e, data }: { edition: Edition; data: ServicePageData }) {
  const s = data.service;
    const lang = langName(e.contentLang);
  const price = formatPrice(s.priceFrom, s.currency);
  const chips = [
    { href: paths.service(e, s.slug), label: "All", active: true },
    { href: catalogHref(e.routes.movies, { service: s.slug, audio: "dub" }), label: `${cap(dubTerm(e.contentLang))} only`, local: true, dot: true },
    { href: catalogHref(e.routes.movies, { service: s.slug }), label: "Movies" },
    { href: catalogHref(e.routes.series, { service: s.slug }), label: "Series" },
    { href: catalogHref(e.routes.anime, { service: s.slug }), label: "Anime" },
  ];
  const planNote = price
    ? s.priceFrom === 0
      ? `Free plan${s.hasAdsTier ? " (ad-supported)" : ""}`
      : `Plans from ${price} per month${s.hasAdsTier ? " · ad-supported plan available" : ""}`
    : s.hasAdsTier
      ? "Ad-supported plan available"
      : null;

  return (
    <header className="wrap pt-6 pb-4 md:pt-12 md:pb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="flex min-w-0 items-center gap-4 md:gap-7">
          <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={64} className="md:hidden" />
          <ServiceLogo slug={s.slug} name={s.name} logoPath={s.logoPath} size={112} className="max-md:hidden" />
          <div className="min-w-0">
            <p lang="en" className="overline text-text-3">
              Streaming service
            </p>
            <h1 className="mt-1.5 text-[30px] leading-[1.05] font-medium tracking-[-0.04em] md:mt-3 md:text-[56px] xl:text-[68px]">
              {s.name} <span className="text-text-3">in {e.countryName}</span>
            </h1>
          </div>
        </div>
        {s.homeUrl ? (
          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-end lg:gap-2.5 lg:pb-2">
            <OutboundLink
              href={s.homeUrl}
              service={s.slug}
              title={`${s.name} (service page)`}
              country={e.country}
              lang={e.contentLang}
              className={buttonClass("accent", "lg")}
            >
              Go to {s.name}
              <ArrowUpRightIcon className="size-[18px]" />
            </OutboundLink>
            {data.lastCheckedAt ? <CheckedAt at={data.lastCheckedAt} className="max-sm:text-center" /> : null}
          </div>
        ) : null}
      </div>

      <ul className="mt-6 flex flex-wrap gap-2 md:mt-9">
        <li className="tag">
          <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 rounded-full bg-dub" />
          {lang} dub &amp; subtitles shown only when the service confirms them
        </li>
        {planNote ? <li className="tag tnum">{planNote}</li> : null}
      </ul>

      <nav aria-label={`${s.name} shortcuts`} className="mt-5 md:mt-7">
        <ChipRow>
          {chips.map((c) => (
            <ChipLink key={c.label} href={c.href} active={c.active}>
              {c.dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" /> : null}
              <span lang={c.local ? e.hreflang : undefined}>{c.label}</span>
            </ChipLink>
          ))}
        </ChipRow>
      </nav>
    </header>
  );
}
