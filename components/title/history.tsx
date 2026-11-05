import { ServiceLogo } from "@/components/ui/service-logo";
import { formatDate, formatMonth, formatPrice } from "@/lib/format";
import { langName } from "@/lib/lang";
import type { HistoryEvent, TitlePageData } from "@/lib/queries/title";

type Lane = { key: string; label: string; slug?: string; name?: string; spans: { from: Date; to: Date; open: boolean; kind: "sub" | "paid" | "theater" }[] };

/** V3 — availability lanes per service + change log, built only from recorded events. */
export function History({ data, editionLang, countryName }: { data: TitlePageData; editionLang: string; countryName: string }) {
  const now = new Date();
  const lanes = buildLanes(data, now);
  const log = data.events.slice(0, 8);
  if (lanes.length === 0 && log.length === 0) return null;

  const start = new Date(Math.min(...lanes.flatMap((l) => l.spans.map((s) => s.from.getTime())), now.getTime() - 90 * 86_400_000));
  start.setDate(1);
  const total = now.getTime() - start.getTime();
  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / total) * 100));
  const ticks = Array.from({ length: 5 }, (_, i) => new Date(start.getTime() + (total * i) / 4));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
      <section aria-labelledby="history" className="rounded-panel border border-line bg-surface p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-baseline gap-x-3">
          <h2 id="history" className="text-xl font-extrabold md:text-2xl">
            Availability history
          </h2>
          <span className="text-sm text-text-2">Where it has been in {countryName}</span>
        </div>
        <ul className="space-y-4">
          {lanes.map((l) => (
            <li key={l.key} className="grid grid-cols-[96px_1fr] items-center gap-3 md:grid-cols-[130px_1fr]">
              <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
                {l.slug ? <ServiceLogo slug={l.slug} name={l.name!} size={20} /> : null}
                <span className="truncate">{l.label}</span>
              </span>
              <div className="relative h-7">
                <div className="absolute inset-x-0 bottom-0 h-2 rounded-chip bg-surface-2" />
                {l.spans.map((s, i) => (
                  <div key={i} className="absolute bottom-0" style={{ left: `${pct(s.from)}%`, width: `${Math.max(1.5, pct(s.to) - pct(s.from))}%` }}>
                    <span className={`absolute bottom-3 text-[11px] whitespace-nowrap text-text-2 ${pct(s.from) > 60 ? "right-0" : "left-0"}`}>
                      {s.kind === "theater" ? "In theaters" : s.kind === "paid" ? "Rent / buy" : "Subscription"} · {formatMonth(s.from)}
                      {s.open ? "" : ` – ${formatMonth(s.to)}`}
                    </span>
                    <div className={`h-2 rounded-chip ${s.kind === "sub" ? (s.open ? "bg-orange" : "bg-leaving/80") : s.kind === "paid" ? "bg-text-3" : "bg-text-3/60"}`} />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 ml-[108px] flex justify-between text-[11px] text-text-3 md:ml-[142px]">
          {ticks.map((t) => (
            <span key={t.getTime()}>{formatMonth(t)}</span>
          ))}
        </div>
        <p className="mt-4 text-sm text-text-2">We record every change since launch. Titles often move between services every 6–12 months.</p>
      </section>

      <section aria-labelledby="changelog" className="rounded-panel border border-line bg-surface p-5 md:p-6">
        <h2 id="changelog" className="mb-4 text-xl font-extrabold md:text-2xl">
          Change log
        </h2>
        <ol className="space-y-4">
          {log.map((e) => {
            const v = describe(e, editionLang);
            return (
              <li key={e.id} className="grid grid-cols-[88px_1fr] gap-3 text-sm">
                <time dateTime={e.occurredAt.toISOString()} className="text-text-3">
                  {formatDate(e.occurredAt)}
                </time>
                <div>
                  <span className={`inline-block rounded-chip px-2 py-0.5 text-[11px] font-extrabold ${v.tone}`}>{v.badge}</span>
                  <p className="mt-1">{v.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function buildLanes(data: TitlePageData, now: Date): Lane[] {
  const lanes = new Map<string, Lane>();
  const theatrical = data.title.releases.find((r) => r.stage === "theatrical" && r.date && r.date <= now);
  const digital = data.title.releases.find((r) => r.stage === "digital" && r.date);
  if (theatrical?.date) {
    lanes.set("theaters", {
      key: "theaters",
      label: "Theaters",
      spans: [{ from: theatrical.date, to: digital?.date && digital.date < now ? digital.date : new Date(theatrical.date.getTime() + 60 * 86_400_000), open: false, kind: "theater" }],
    });
  }
  const chrono = [...data.events].reverse();
  const openAt = new Map<string, Date>();
  for (const e of chrono) {
    const key = `${e.serviceSlug}:${e.offerType === "rent" || e.offerType === "buy" ? "paid" : "sub"}`;
    const lane = lanes.get(e.serviceSlug) ?? { key: e.serviceSlug, label: e.serviceName, slug: e.serviceSlug, name: e.serviceName, spans: [] };
    lanes.set(e.serviceSlug, lane);
    if (e.type === "added" && !openAt.has(key)) openAt.set(key, e.occurredAt);
    if (e.type === "removed") {
      const from = openAt.get(key);
      if (from) {
        lane.spans.push({ from, to: e.occurredAt, open: false, kind: key.endsWith("paid") ? "paid" : "sub" });
        openAt.delete(key);
      }
    }
  }
  for (const [key, from] of openAt) {
    const [slug, kind] = key.split(":") as [string, "paid" | "sub"];
    lanes.get(slug)?.spans.push({ from, to: now, open: true, kind });
  }
  return [...lanes.values()].filter((l) => l.spans.length > 0);
}

function describe(e: HistoryEvent, lang: string): { badge: string; text: string; tone: string } {
  const after = (e.after ?? {}) as { price?: number; lang?: string; leavingAt?: string };
  const before = (e.before ?? {}) as { price?: number };
  switch (e.type) {
    case "added":
      return { badge: `Added to ${e.serviceName}`, text: e.offerType === "rent" || e.offerType === "buy" ? "Rent / buy" : "Included with subscription", tone: "bg-available text-ink" };
    case "removed":
      return { badge: `Left ${e.serviceName}`, text: "No longer on this service", tone: "bg-leaving text-ink" };
    case "price_change": {
      const down = (after.price ?? 0) < (before.price ?? 0);
      return {
        badge: down ? "Price drop" : "Price change",
        text: `${e.serviceName} ${e.offerType ?? ""} ${formatPrice(before.price, "TRY")} → ${formatPrice(after.price, "TRY")}`,
        tone: "bg-free text-ink",
      };
    }
    case "audio_added":
      return { badge: `${langName(after.lang ?? lang)} dub added`, text: `On ${e.serviceName}`, tone: "bg-dub text-white" };
    case "audio_removed":
      return { badge: "Dub removed", text: `On ${e.serviceName}`, tone: "bg-surface-2 text-text" };
    case "subtitle_added":
      return { badge: "Subtitles added", text: `On ${e.serviceName}`, tone: "bg-white text-ink" };
    case "leaving_announced":
      return { badge: `Leaving ${e.serviceName}`, text: after.leavingAt ? `Last day ${formatDate(after.leavingAt)}` : "Leaving soon", tone: "bg-leaving text-ink" };
    default:
      return { badge: e.type.replace(/_/g, " "), text: e.serviceName, tone: "bg-surface-2 text-text" };
  }
}
