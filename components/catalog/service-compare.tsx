import Link from "next/link";
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
  const rows: { label: string; cell: (c: (typeof cols)[number]) => string }[] = [
    { label: `Titles in ${e.countryName}`, cell: (c) => fmt(c.stats.titles) },
    { label: `Titles with ${lang} dub`, cell: (c) => fmt(c.stats.dub) },
    { label: `Titles with ${lang} subtitles`, cell: (c) => fmt(c.stats.sub) },
    { label: "Cheapest plan", cell: price },
    { label: "Ad-supported plan", cell: (c) => (c.hasAdsTier ? "Yes" : "—") },
    { label: "Titles in 4K", cell: (c) => fmt(c.stats.uhd) },
  ];

  return (
    <section id="compare" className="mx-auto grid max-w-site scroll-mt-20 gap-6 px-4 pt-5 pb-12 md:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-8">
      <div>
        <h2 className="mb-4 text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
          {cols.map((c) => c.name).join(" vs ")} in {e.countryName}
        </h2>
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-text-2">
                <th scope="col" className="px-4 py-3 text-left font-bold">
                  <span className="sr-only">Feature</span>
                </th>
                {cols.map((c) => (
                  <th key={c.slug} scope="col" className="px-3 py-3 text-center font-bold">
                    {c.slug === s.slug ? c.name : <Link href={paths.service(e, c.slug)} className="text-text-2">{c.name}</Link>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-bold">
                    {r.label}
                  </th>
                  {cols.map((c) => (
                    <td key={c.slug} className={`px-3 py-3 text-center tabular-nums ${c.slug === s.slug ? "font-extrabold text-orange" : "text-text"}`}>
                      {r.cell(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 text-xs text-text-3">
          Language counts include only audio and subtitles confirmed by each service. Prices are the lowest listed plan — check the service before
          subscribing.
        </p>
      </div>
      <aside className="h-fit rounded-panel border border-line bg-surface p-5">
        <h2 className="mb-2 text-[15px] font-extrabold">Other services in {e.countryName}</h2>
        <ul>
          {data.others.map((o) => (
            <li key={o.slug}>
              <Link href={paths.service(e, o.slug)} className="flex items-center gap-3 rounded-lg py-2 text-sm font-bold text-text">
                <ServiceLogo slug={o.slug} name="" logoPath={o.logoPath} size={26} />
                <span className="grow">{o.name}</span>
                <span className="text-xs font-semibold text-text-3">{fmt(o.stats.titles)} titles</span>
                <span aria-hidden="true" className="text-text-3">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
