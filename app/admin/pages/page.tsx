import Link from "next/link";
import { EditionLabel } from "@/components/admin/edition-label";
import { AdminHeader, Kpi, Panel, Tag } from "@/components/admin/ui";
import { adminEdition } from "@/lib/admin/edition";
import { getPageInventory, summarizeInventory, type PageType } from "@/lib/seo/pages";

export const metadata = { title: "Pages & SEO" };

const TYPES: PageType[] = ["home", "catalog", "lang_hub", "kids", "service", "list", "franchise", "new_leaving", "trailers", "releases", "title", "season", "person", "static"];

export default async function AdminPages({ searchParams }: PageProps<"/admin/pages">) {
  const sp = await searchParams;
  const e = adminEdition(sp.edition);
  const filter = typeof sp.type === "string" && (TYPES as string[]).includes(sp.type) ? sp.type : null;
  const pages = await getPageInventory(e);
  const s = summarizeInventory(pages);
  const shown = pages.filter((p) => (filter ? p.type === filter : !p.index && p.type !== "season" && p.type !== "person"));

  return (
    <>
      <AdminHeader title="Pages & SEO" right={<EditionLabel edition={e} />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:gap-4">
        <Kpi label="URLs" value={s.total} />
        <Kpi label="Indexable (sitemap)" value={s.index} tone="good" />
        <Kpi label="Noindex" value={s.noindex} />
        <Kpi label="Titles indexable" value={`${s.byType.title?.index ?? 0} / ${(s.byType.title?.index ?? 0) + (s.byType.title?.noindex ?? 0)}`} />
      </div>
      <Panel title="By page type" className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pages" className={`rounded-chip border px-3 py-1.5 text-[13px] font-bold ${!filter ? "border-orange text-text" : "border-line text-text-2"}`}>
            Noindex (excl. seasons/persons)
          </Link>
          {TYPES.filter((t) => s.byType[t]).map((t) => (
            <Link key={t} href={`/admin/pages?type=${t}`} className={`rounded-chip border px-3 py-1.5 text-[13px] font-bold ${filter === t ? "border-orange text-text" : "border-line text-text-2"}`}>
              {t} <span className="text-available">{s.byType[t]!.index}</span> / <span className="text-text-3">{s.byType[t]!.noindex}</span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-3">
          Computed live from data (quality gate). <code>scripts/seo/sync-pages.ts</code> writes the same inventory to the Page table. Sitemap: <a href="/sitemap.xml" className="text-orange">/sitemap.xml</a>
        </p>
      </Panel>
      <Panel title={`${filter ?? "noindex"} · ${shown.length}`} className="mt-4">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-extrabold tracking-wider text-text-3 uppercase">
                <th className="py-2 pr-3 font-extrabold">Path</th>
                <th className="py-2 pr-3 font-extrabold">Type</th>
                <th className="py-2 pr-3 font-extrabold">Index</th>
                <th className="py-2 font-extrabold">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 500).map((p) => (
                <tr key={p.path} className="border-b border-line-soft last:border-0">
                  <td className="py-2 pr-3">
                    <Link href={p.path} target="_blank" className="break-all">
                      {p.path}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-text-2">{p.type}</td>
                  <td className="py-2 pr-3">{p.index ? <Tag tone="good">index</Tag> : <Tag>noindex</Tag>}</td>
                  <td className="py-2 text-xs text-leaving">{p.reasons.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
