import Link from "next/link";
import { EditionLabel } from "@/components/admin/edition-label";
import { ReportActions } from "@/components/admin/report-actions";
import { TmdbLinkForm } from "@/components/admin/tmdb-link-form";
import { AdminHeader, formatAge, Panel, StatusPill, Tag } from "@/components/admin/ui";
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

      <Panel title={`“Something wrong?” reports — SLA ${REPORT_SLA_HOURS} h`} right={<span className="text-xs font-bold text-text-3">{open} open · resolved last 7 days below</span>}>
        {reports.length === 0 ? (
          <p className="py-4 text-sm text-text-3">No reports. Nice.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-extrabold tracking-wider text-text-3 uppercase">
                  <th className="py-2 pr-3 font-extrabold">Title</th>
                  <th className="py-2 pr-3 font-extrabold">Service / offer</th>
                  <th className="py-2 pr-3 font-extrabold">Issue</th>
                  <th className="py-2 pr-3 font-extrabold">Status</th>
                  <th className="py-2 pr-3 font-extrabold">Age</th>
                  <th className="py-2 font-extrabold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const href = r.title.slug ? paths.title(e, r.title.type, r.title.slug) : null;
                  return (
                    <tr key={r.id} className={`border-b border-line-soft align-middle last:border-0 ${r.unresolved ? "" : "opacity-60"}`}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <PosterImage path={r.title.posterPath} alt={r.title.name} sizes="32px" className="w-8 shrink-0 rounded-[6px]" />
                          <div className="min-w-0">
                            {href ? (
                              <Link href={href} target="_blank" className="font-extrabold">
                                {r.title.name} <span aria-hidden="true" className="text-text-3">↗</span>
                              </Link>
                            ) : (
                              <span className="font-extrabold">{r.title.name}</span>
                            )}
                            <div className="text-xs text-text-3">#{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-text-2">
                        {r.offer ? (
                          <>
                            {r.offer.service}
                            <div className="text-xs text-text-3">
                              {offerTypeLabel(r.offer.type)} · {r.offer.country} · offer #{r.offer.id}
                            </div>
                          </>
                        ) : (
                          <span className="text-text-3">—</span>
                        )}
                      </td>
                      <td className="max-w-[320px] py-3 pr-3">
                        {REPORT_KIND_LABEL[r.kind]}
                        {r.note ? <div className="mt-0.5 text-xs text-text-2">“{r.note}”</div> : null}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className={`py-3 pr-3 font-bold tabular-nums ${r.breached ? "text-red-400" : "text-text-2"}`}>
                        {formatAge(r.ageHours)}
                        {r.breached ? <div className="text-[11px] font-extrabold">SLA breached</div> : null}
                        {r.unresolved && !r.breached ? <div className="text-[11px] font-semibold text-text-3">{formatAge(r.slaLeftHours)} left</div> : null}
                      </td>
                      <td className="py-3">
                        <ReportActions id={r.id} status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Noindex titles — quality gate & entity resolution" className="mt-4" right={<span className="text-xs font-bold text-text-3">{noindex.length} titles</span>}>
        <p className="mb-2 text-xs text-text-3">Ambiguous names (“Legend”, “Obsession”) are resolved by TMDB id. Re-linking changes Title.tmdbId; the next metadata ingest refreshes the data.</p>
        {noindex.length === 0 ? (
          <p className="py-4 text-sm text-text-3">All titles pass the gate.</p>
        ) : (
          <ul>
            {noindex.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 border-b border-line-soft py-3 last:border-0 md:flex-row md:items-center">
                <div className="min-w-0 grow">
                  <div className="font-extrabold">
                    {t.slug ? (
                      <Link href={paths.title(e, t.type, t.slug)} target="_blank">
                        “{t.name}”
                      </Link>
                    ) : (
                      `“${t.name}”`
                    )}
                    <span className="ml-2 text-xs font-semibold text-text-3">
                      {t.originalTitle !== t.name ? `${t.originalTitle} · ` : ""}
                      {t.type} · {t.year ?? "year?"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
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
