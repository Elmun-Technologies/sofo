import { BarList } from "@/components/admin/bar-list";
import { EditionLabel } from "@/components/admin/edition-label";
import { AdminHeader, EventPill, formatAge, Kpi, nf, Panel } from "@/components/admin/ui";
import { adminEdition } from "@/lib/admin/edition";
import { FRESH_HOURS, getDashboard, REPORT_SLA_HOURS } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const sameDay = (a: Date, b: Date) => a.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) === b.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const e = adminEdition((await searchParams).edition);
  const d = await getDashboard(e);
  const freshPct = d.offersFreshPct;
  const ingestAgeH = d.lastIngestAt ? (d.now.getTime() - d.lastIngestAt.getTime()) / 3_600_000 : null;

  return (
    <>
      <AdminHeader title="Dashboard" right={<EditionLabel edition={e} />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4">
        <Kpi label={`Titles (${e.code.toUpperCase()})`} value={nf(d.titles)} sub={`+${d.titlesNew} this week`} />
        <Kpi label="Active offers" value={nf(d.offersActive)} sub={`${d.services.length} services`} />
        <Kpi
          label={`Checked ≤ ${FRESH_HOURS} h`}
          value={freshPct == null ? "—" : `${freshPct.toFixed(1)}%`}
          tone={freshPct == null ? "default" : freshPct >= 99 ? "good" : freshPct >= 90 ? "warn" : "bad"}
          sub="target 99%"
        />
        <Kpi
          label="Indexable title pages"
          value={`${nf(d.titlePages.index)} / ${nf(d.titlePages.total)}`}
          sub={`${d.titlePages.total - d.titlePages.index} noindex · ${d.inventory.index} URLs in sitemap`}
        />
        <Kpi
          label="Open reports"
          value={d.reports.open}
          tone={d.reports.breaches > 0 ? "bad" : d.reports.open > 0 ? "warn" : "good"}
          sub={
            d.reports.open === 0
              ? "queue empty"
              : `oldest ${formatAge(d.reports.oldestHours ?? 0)} · ${d.reports.breaches} over ${REPORT_SLA_HOURS} h SLA`
          }
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Panel
          title="Ingest — offer freshness by service"
          right={
            <span className={`text-xs font-bold ${ingestAgeH != null && ingestAgeH > 26 ? "text-leaving" : "text-text-3"}`}>
              Last ingest: {d.lastIngestAt ? `${formatDate(d.lastIngestAt)} ${time(d.lastIngestAt)}` : "never"}
            </span>
          }
        >
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-extrabold tracking-wider text-text-3 uppercase">
                  <th className="py-2 pr-3 font-extrabold">Service</th>
                  <th className="py-2 pr-3 text-right font-extrabold">Offers</th>
                  <th className="py-2 pr-3 text-right font-extrabold">≤ {FRESH_HOURS} h</th>
                  <th className="py-2 pr-3 font-extrabold">Last check</th>
                  <th className="py-2 font-extrabold">Oldest</th>
                </tr>
              </thead>
              <tbody>
                {d.services.map((s) => {
                  const pct = s.offers ? (s.fresh / s.offers) * 100 : 0;
                  return (
                    <tr key={s.name} className="border-b border-line-soft last:border-0">
                      <td className="py-2.5 pr-3 font-bold">{s.name}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{s.offers}</td>
                      <td className={`py-2.5 pr-3 text-right font-bold tabular-nums ${pct >= 99 ? "text-available" : "text-leaving"}`}>
                        <span aria-hidden="true">{pct >= 99 ? "✓ " : "! "}</span>
                        {pct.toFixed(0)}%
                      </td>
                      <td className="py-2.5 pr-3 text-text-2">{s.lastCheckedAt ? `${formatDate(s.lastCheckedAt, { day: "numeric", month: "short" })} ${time(s.lastCheckedAt)}` : "—"}</td>
                      <td className="py-2.5 text-text-2">{s.oldestCheckedAt ? formatDate(s.oldestCheckedAt, { day: "numeric", month: "short" }) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Latest events">
          {d.latestEvents.length === 0 ? (
            <p className="py-3 text-sm text-text-3">No events yet</p>
          ) : (
            <ul>
              {d.latestEvents.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-0">
                  <EventPill type={ev.type} />
                  <span className="min-w-0 grow truncate text-sm">
                    {ev.title} · <span className="text-text-2">{ev.service}</span>
                  </span>
                  <span className="shrink-0 text-xs text-text-3 tabular-nums">
                    {sameDay(ev.occurredAt, d.now) ? time(ev.occurredAt) : formatDate(ev.occurredAt, { day: "numeric", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Noindex reasons">
          <BarList
            rows={Object.entries(d.inventory.reasons)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => ({ key: k, label: k, value: v }))}
            empty="Every page passes the gate"
          />
        </Panel>
        <Panel title="Events · last 7 days">
          <BarList rows={d.eventsByType.map((x) => ({ key: x.type, label: <EventPill type={x.type} />, value: x.count }))} empty="No changes this week" />
        </Panel>
        <Panel title="Top searches · 7 days">
          <BarList rows={d.topSearches.map((s) => ({ key: s.query, label: s.query, value: s.count }))} empty="No searches yet" />
        </Panel>
        <Panel title="Zero-result searches · 7 days">
          <BarList rows={d.zeroSearches.map((s) => ({ key: s.query, label: s.query, value: s.count }))} empty="No zero-result searches" />
        </Panel>
      </div>
    </>
  );
}
