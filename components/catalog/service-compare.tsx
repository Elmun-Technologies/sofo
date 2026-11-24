import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { ServiceLogo } from "@/components/ui/service-logo";
import { paths, type Edition } from "@/lib/editions";
import { formatPrice } from "@/lib/format";
import { langName } from "@/lib/lang";
import type { ServicePageData } from "@/lib/queries/catalog-pages";

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

/** This service vs the two biggest others + list of every other service. */
export function ServiceCompare({ edition: e, data }: { edition: Edition; data: ServicePageData }) {
  const s = data.service;
  const rivals = [...data.others].sort((a, b) => b.stats.titles - a.stats.titles).slice(0, 2);
  const cols = [{ ...s, stats: data.stats }, ...rivals];
  const lang = langName(e.contentLang);
  const price = (c: (typeof cols)[number]) => (c.priceFrom === 0 ? "Free" : (formatPrice(c.priceFrom, c.currency) ?? "—"));
  const rows: { label: string; dot?: string; cell: (c: (typeof cols)[number]) => string }[] = [
    { label: `Titles in ${e.countryName}`, cell: (c) => fmt(c.stats.titles) },
    { label: `Titles with ${lang} dub`, dot: "bg-dub", cell: (c) => fmt(c.stats.dub) },
    { label: `Titles with ${lang} subtitles`, dot: "bg-white/70", cell: (c) => fmt(c.stats.sub) },
    { label: "Cheapest plan", cell: price },
    { label: "Ad-supported plan", cell: (c) => (c.hasAdsTier ? "Yes" : "—") },
    { label: "Titles in 4K", cell: (c) => fmt(c.stats.uhd) },
  ];
  const mine = "bg-white/[0.045]";

  return (
    <section id="compare" className="wrap scroll-mt-24 pt-6 pb-14 md:pt-10 md:pb-24">
      <div className="rule mb-6 md:mb-8" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <SectionHeader title={`${cols.map((c) => c.name).join(" vs ")} in ${e.countryName}`} sub="Side by side, from what each service confirms today" />
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[330px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="border-b border-hairline px-4 py-4 text-left align-bottom text-xs font-medium text-text-3 md:px-6">
                    <span className="sr-only">Feature</span>
                  </th>
                  {cols.map((c) => {
                    const self = c.slug === s.slug;
                    const head = (
                      <span className="flex flex-col items-center gap-2">
                        <ServiceLogo slug={c.slug} name="" logoPath={c.logoPath} size={32} />
                        <span className={`max-w-full truncate text-xs font-semibold md:text-[13px] ${self ? "text-text" : "text-text-2"}`}>{c.name}</span>
                      </span>
                    );
                    return (
                      <th key={c.slug} scope="col" className={`w-[21%] border-b border-hairline px-1.5 pt-5 pb-4 text-center md:w-[20%] md:px-3 ${self ? mine : ""}`}>
                        {self ? (
                          head
                        ) : (
                          <Link href={paths.service(e, c.slug)} className="block hover:text-text">
                            {head}
                          </Link>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const edge = i === rows.length - 1 ? "" : "border-b border-hairline";
                  return (
                    <tr key={r.label}>
                      <th scope="row" className={`px-4 py-3.5 text-left text-[13px] font-medium text-text-2 md:px-6 md:py-4 md:text-sm ${edge}`}>
                        <span className="flex items-center gap-2">
                          {r.dot ? <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${r.dot}`} /> : null}
                          {r.label}
                        </span>
                      </th>
                      {cols.map((c) => {
                        const self = c.slug === s.slug;
                        return (
                          <td key={c.slug} className={`tnum px-1.5 py-3.5 text-center md:px-3 md:py-4 md:text-[15px] ${edge} ${self ? `${mine} font-semibold text-text` : "text-text-2"}`}>
                            {r.cell(c)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3.5 max-w-2xl text-xs leading-relaxed text-text-3">
            Language counts include only audio and subtitles confirmed by each service. Prices are the lowest listed plan — check the service before
            subscribing.
          </p>
        </div>

        <aside className="panel h-fit min-w-0 p-5 md:p-6">
          <h2 className="text-h3">Other services in {e.countryName}</h2>
          <ul className="mt-3 divide-y divide-hairline">
            {data.others.map((o) => (
              <li key={o.slug}>
                <Link href={paths.service(e, o.slug)} className="group flex items-center gap-3 py-3 text-sm text-text-2 hover:text-text">
                  <ServiceLogo slug={o.slug} name="" logoPath={o.logoPath} size={28} />
                  <span className="min-w-0 flex-1 truncate font-medium text-text">{o.name}</span>
                  <span className="tnum text-xs text-text-3">
                    {fmt(o.stats.titles)} title{o.stats.titles === 1 ? "" : "s"}
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-text-3 transition duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
