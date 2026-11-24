import Link from "next/link";
import { EditionLabel } from "@/components/admin/edition-label";
import { AdminHeader, Kpi, Panel, TableScroll, Tag, tableClass, tdClass, thClass, trClass } from "@/components/admin/ui";
import { adminEdition } from "@/lib/admin/edition";
import { getPageInventory, summarizeInventory, type PageType } from "@/lib/seo/pages";

export const metadata = { title: "Pages & SEO" };

const chip = (active: boolean) =>
  `inline-flex h-9 items-center gap-2.5 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition duration-200 ease-out ${
    active ? "bg-white text-ink hover:text-ink" : "text-text-2 ring-1 ring-inset ring-hairline-strong hover:bg-white/6 hover:text-text hover:ring-white/30"
  }`;

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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="URLs" value={s.total} />
        <Kpi label="Indexable (sitemap)" value={s.index} tone="good" />
        <Kpi label="Noindex" value={s.noindex} />
        <Kpi label="Titles indexable" value={`${s.byType.title?.index ?? 0} / ${(s.byType.title?.index ?? 0) + (s.byType.title?.noindex ?? 0)}`} />
      </div>
      <Panel title="By page type" className="mt-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pages" aria-current={!filter ? "true" : undefined} className={chip(!filter)}>
            Noindex (excl. seasons/persons)
          </Link>
          {TYPES.filter((t) => s.byType[t]).map((t) => (
            <Link key={t} href={`/admin/pages?type=${t}`} aria-current={filter === t ? "true" : undefined} className={chip(filter === t)}>
              {t}
              <span className="tnum inline-flex items-center gap-1.5" title="index / noindex">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
                {s.byType[t]!.index}
                <span className={filter === t ? "text-ink/45" : "text-text-3"}>/ {s.byType[t]!.noindex}</span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-3">
          Computed live from data (quality gate). <code className="rounded-[6px] bg-white/6 px-1.5 py-0.5 text-[11px] text-text-2">scripts/seo/sync-pages.ts</code> writes the same inventory to
          the Page table. Sitemap:{" "}
          <a href="/sitemap.xml" className="link !font-medium">
            /sitemap.xml
          </a>
        </p>
      </Panel>
      <Panel title={`${filter ?? "noindex"} · ${shown.length}`} className="mt-3">
        {shown.length === 0 ? (
          <p className="py-2 text-sm text-text-3">Nothing here — every page of this kind passes the gate.</p>
        ) : (
          <TableScroll className="-mb-2 max-h-[640px]">
            <table className={`${tableClass} min-w-[640px]`}>
              <thead>
                <tr>
                  <th className={thClass}>Path</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Index</th>
                  <th className={thClass}>Reasons</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, 500).map((p) => (
                  <tr key={p.path} className={trClass}>
                    <td className={`${tdClass} !py-2.5`}>
                      <Link href={p.path} target="_blank" className="font-medium break-all">
                        {p.path}
                      </Link>
                    </td>
                    <td className={`${tdClass} !py-2.5 whitespace-nowrap text-text-2`}>{p.type}</td>
                    <td className={`${tdClass} !py-2.5`}>{p.index ? <Tag tone="good">index</Tag> : <Tag>noindex</Tag>}</td>
                    <td className={`${tdClass} !py-2.5 text-xs text-leaving`}>{p.reasons.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </>
  );
}
