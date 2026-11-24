import Link from "next/link";
import { EditionLabel } from "@/components/admin/edition-label";
import { ReportActions } from "@/components/admin/report-actions";
import { TmdbLinkForm } from "@/components/admin/tmdb-link-form";
import { AdminHeader, formatAge, Panel, StatusPill, TableScroll, Tag, tableClass, tdClass, thClass, trClass } from "@/components/admin/ui";
import { ArrowUpRightIcon } from "@/components/icons";
import { PosterImage } from "@/components/ui/poster-image";
import { adminEdition } from "@/lib/admin/edition";
import { getNoindexTitles, getReports, REPORT_KIND_LABEL, REPORT_SLA_HOURS } from "@/lib/admin/queries";
import { paths } from "@/lib/editions";
import { offerTypeLabel } from "@/lib/services";

export const metadata = { title: "Data QA" };

export default async function AdminQA({ searchParams }: PageProps<"/admin/qa">) {
  const e = adminEdition((await searchParams).edition);
  const [reports, noindex] = await Promise.all([getReports(e), getNoindexTitles(e)]);
  const open = reports.filter((r) => r.unresolved).length;

  return (
    <>
      <AdminHeader title="Data QA" right={<EditionLabel edition={e} />} />

      <Panel title={`“Something wrong?” reports — SLA ${REPORT_SLA_HOURS} h`} right={<span className="tnum text-xs text-text-3">{open} open · resolved last 7 days below</span>}>
        {reports.length === 0 ? (
          <p className="py-2 text-sm text-text-3">No reports. Nice.</p>
        ) : (
          <TableScroll className="-mb-2 max-h-[72vh]">
            <table className={`${tableClass} min-w-[960px]`}>
              <thead>
                <tr>
                  <th className={thClass}>Title</th>
                  <th className={thClass}>Service / offer</th>
                  <th className={thClass}>Issue</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Age</th>
                  <th className={thClass}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const href = r.title.slug ? paths.title(e, r.title.type, r.title.slug) : null;
                  return (
                    <tr key={r.id} className={`${trClass} ${r.unresolved ? "" : "opacity-55"}`}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <PosterImage path={r.title.posterPath} alt={r.title.name} sizes="32px" className="w-8 shrink-0 !rounded-[6px]" />
                          <div className="min-w-0">
                            {href ? (
                              <Link href={href} target="_blank" className="font-medium">
                                {r.title.name} <ArrowUpRightIcon className="inline size-3.5 -translate-y-px text-text-3" />
                              </Link>
                            ) : (
                              <span className="font-medium">{r.title.name}</span>
                            )}
                            <div className="tnum text-xs text-text-3">#{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdClass} text-text-2`}>
                        {r.offer ? (
                          <>
                            {r.offer.service}
                            <div className="tnum text-xs whitespace-nowrap text-text-3">
                              {offerTypeLabel(r.offer.type)} · {r.offer.country} · offer #{r.offer.id}
                            </div>
                          </>
                        ) : (
                          <span className="text-text-3">—</span>
                        )}
                      </td>
                      <td className={`${tdClass} max-w-[320px]`}>
                        {REPORT_KIND_LABEL[r.kind]}
                        {r.note ? <div className="mt-0.5 text-xs text-text-2">“{r.note}”</div> : null}
                      </td>
                      <td className={tdClass}>
                        <StatusPill status={r.status} />
                      </td>
                      <td className={`${tdClass} tnum font-medium whitespace-nowrap ${r.breached ? "text-red-300" : "text-text-2"}`}>
                        {formatAge(r.ageHours)}
                        {r.breached ? <div className="text-[11px] font-medium">SLA breached</div> : null}
                        {r.unresolved && !r.breached ? <div className="text-[11px] font-normal text-text-3">{formatAge(r.slaLeftHours)} left</div> : null}
                      </td>
                      <td className={`${tdClass} w-[1%] min-w-[264px]`}>
                        <ReportActions id={r.id} status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>

      <Panel title="Noindex titles — quality gate & entity resolution" className="mt-3" right={<span className="tnum text-xs text-text-3">{noindex.length} titles</span>}>
        <p className="mb-3 max-w-3xl text-[13px] text-text-3">Ambiguous names (“Legend”, “Obsession”) are resolved by TMDB id. Re-linking changes Title.tmdbId; the next metadata ingest refreshes the data.</p>
        {noindex.length === 0 ? (
          <p className="py-2 text-sm text-text-3">All titles pass the gate.</p>
        ) : (
          <ul>
            {noindex.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 border-t border-hairline py-4 last:pb-0 md:flex-row md:items-center">
                <div className="min-w-0 grow">
                  <div className="font-medium">
                    {t.slug ? (
                      <Link href={paths.title(e, t.type, t.slug)} target="_blank">
                        “{t.name}”
                      </Link>
                    ) : (
                      `“${t.name}”`
                    )}
                    <span className="tnum ml-2 text-xs font-normal text-text-3">
                      {t.originalTitle !== t.name ? `${t.originalTitle} · ` : ""}
                      {t.type} · {t.year ?? "year?"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.gate.reasons.map((reason) => (
                      <Tag key={reason} tone="warn">
                        {reason}
                      </Tag>
                    ))}
                  </div>
                </div>
                <TmdbLinkForm titleId={t.id} tmdbId={t.tmdbId} type={t.type} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
