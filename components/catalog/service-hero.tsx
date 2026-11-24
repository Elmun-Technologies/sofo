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

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

/** Service header: identity, outbound "Go to …", the four numbers that matter, quick filters. */
export function ServiceHero({ edition: e, data }: { edition: Edition; data: ServicePageData }) {
  const s = data.service;
  const st = data.stats;
  const lang = langName(e.contentLang);
  const price = formatPrice(s.priceFrom, s.currency);
  const chips = [
    { href: paths.service(e, s.slug), label: "All", active: true },
    { href: catalogHref(e.routes.movies, { service: s.slug, audio: "dub" }), label: `${cap(dubTerm(e.contentLang))} only`, local: true, dot: true },
    { href: catalogHref(e.routes.movies, { service: s.slug }), label: "Movies" },
    { href: catalogHref(e.routes.series, { service: s.slug }), label: "Series" },
    { href: catalogHref(e.routes.anime, { service: s.slug }), label: "Anime" },
  ];
  const stats: { value: string; label: string; note?: string; dot?: string }[] = [
    { value: fmt(st.titles), label: `Titles in ${e.countryName}` },
    { value: fmt(st.dub), label: `With ${lang} dub`, note: "confirmed by the service", dot: "bg-dub" },
    { value: fmt(st.sub), label: `With ${lang} subtitles`, note: "confirmed by the service", dot: "bg-white/70" },
    price
      ? s.priceFrom === 0
        ? { value: "Free", label: "Cheapest plan", note: s.hasAdsTier ? "ad-supported plan" : undefined }
        : { value: price, label: "From, per month", note: s.hasAdsTier ? "ad-supported plan available" : "cheapest listed plan" }
      : { value: "—", label: "Plan price", note: s.hasAdsTier ? "ad-supported plan available" : "not listed yet" },
  ];

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

      <dl className="mt-7 grid grid-cols-2 gap-2.5 md:mt-12 md:gap-3 lg:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="card flex min-h-[132px] flex-col-reverse justify-between gap-5 p-4 md:min-h-[184px] md:p-6">
            <dt>
              <span className="flex items-start gap-2 text-sm leading-snug font-semibold md:text-[15px]">
                {x.dot ? <span aria-hidden="true" className={`mt-[7px] size-1.5 shrink-0 rounded-full ${x.dot}`} /> : null}
                {x.label}
              </span>
              {x.note ? <span className="mt-0.5 block text-xs text-text-3">{x.note}</span> : null}
            </dt>
            <dd className={`leading-[0.95] font-normal tracking-[-0.05em] ${x.value.length > 5 ? "text-[32px] md:text-[48px]" : "text-[40px] md:text-[64px]"}`}>{x.value}</dd>
          </div>
        ))}
      </dl>

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
