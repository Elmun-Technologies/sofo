import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeavingBadge, NewBadge } from "@/components/ui/badges";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { AlertButton } from "@/components/value/alert-button";
import { hrefWith, one, ServiceChips } from "@/components/value/filters";
import { getServices } from "@/lib/catalog";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { daysUntil, formatDate } from "@/lib/format";
import { dubTerm, langName } from "@/lib/lang";
import { addDays, getNewLeaving, weekOf, type CalendarItem } from "@/lib/queries/value-pages";
import { buildAlternates } from "@/lib/seo/hreflang";

// Reads searchParams → rendered per request (the [lang] segment is otherwise ISR-cached; ADR 0002).
export const dynamic = "force-dynamic";

const WEEKS = { onceki: -7, sonraki: 7 } as const;

export async function generateMetadata({ params }: PageProps<"/[lang]/yeni-ve-ayrilanlar">): Promise<Metadata> {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) return {};
  return {
    title: `New & leaving in ${e.countryName} this week — new ${dubTerm(e.contentLang)} and last chances`,
    description: `What's new on Netflix, Disney+, Prime Video and other legal services in ${e.countryName} this week, new ${dubTerm(e.contentLang)} releases and titles leaving soon.`,
    alternates: buildAlternates(e.routes.newLeaving, { [e.hreflang]: e.routes.newLeaving }),
  };
}

const dayLabel = (key: string, opts: Intl.DateTimeFormatOptions) => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

function rangeLabel(days: string[]) {
  const a = days[0]!;
  const b = days[6]!;
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  return sameMonth
    ? `${dayLabel(a, { month: "short" })} ${Number(a.slice(8))}–${Number(b.slice(8))}`
    : `${dayLabel(a, { day: "numeric", month: "short" })} – ${dayLabel(b, { day: "numeric", month: "short" })}`;
}

export default async function NewLeavingPage({ params, searchParams }: PageProps<"/[lang]/yeni-ve-ayrilanlar">) {
  const { lang } = await params;
  const e = getEdition(lang);
  if (!e) notFound();
  const sp = await searchParams;
  const services = await getServices(e);
  const serviceParam = one(sp.servis);
  const service = services.some((s) => s.slug === serviceParam) ? serviceParam : undefined;
  const dubOnly = one(sp.dublaj) === "1";
  const weekParam = one(sp.hafta);
  const week = weekParam === "onceki" || weekParam === "sonraki" ? weekParam : undefined;
  const current = { servis: service, dublaj: dubOnly ? "1" : undefined, hafta: week };
  const base = e.routes.newLeaving;

  const data = await getNewLeaving(e, { service, dubOnly });
  const days = weekOf(addDays(data.today, week ? WEEKS[week] : 0));
  const inWeek = new Set(days);
  const byDay = new Map<string, CalendarItem[]>(days.map((d) => [d, []]));
  for (const it of [...data.added, ...data.leaving]) if (inWeek.has(it.day)) byDay.get(it.day)!.push(it);
  // New dubs first, then new, then leaving.
  const ORDER = { new_dub: 0, new: 1, leaving: 2 } as const;
  for (const list of byDay.values()) list.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  const weekTotal = [...byDay.values()].reduce((n, l) => n + l.length, 0);
  const term = dubTerm(e.contentLang);
  const langLabel = langName(e.contentLang);

  return (
    <>
      <header className="mx-auto max-w-site px-4 pt-5 md:px-7 md:pt-8">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[48px]">
          New &amp; leaving<span className="hidden md:inline"> in {e.countryName}</span>
        </h1>
        <p className="mt-1 text-[15px] text-text-2 md:hidden">
          Week of {rangeLabel(days)} · {e.countryName}
        </p>

        <div className="mt-4 flex flex-col gap-3 md:mt-5 lg:flex-row lg:items-center">
          <ChipRow className="md:flex-nowrap">
            <ChipLink href={hrefWith(base, current, { hafta: "onceki" })} active={week === "onceki"} scroll={false}>
              Last week
            </ChipLink>
            <ChipLink href={hrefWith(base, current, { hafta: null })} active={!week} scroll={false}>
              This week<span className="hidden sm:inline"> · {rangeLabel(weekOf(data.today))}</span>
            </ChipLink>
            <ChipLink href={hrefWith(base, current, { hafta: "sonraki" })} active={week === "sonraki"} scroll={false}>
              Next week
            </ChipLink>
          </ChipRow>
          <span className="hidden h-7 w-px bg-line lg:block" aria-hidden="true" />
          <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
            <ServiceChips services={services} active={service} hrefFor={(slug) => hrefWith(base, current, { servis: slug })} />
          </div>
          <div className="lg:ml-auto">
            <ChipLink href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} scroll={false}>
              {dubOnly ? "✓ " : ""}Only {langLabel} dub
            </ChipLink>
          </div>
        </div>
      </header>

      {/* ── Week calendar ── */}
      <section aria-label={`Week of ${rangeLabel(days)}`} className="mx-auto max-w-site px-4 pt-5 md:px-7 md:pt-8">
        {/* Mobile/tablet: day strip (anchors) + stacked days */}
        <nav aria-label="Days" className="grid grid-cols-7 gap-1.5 lg:hidden">
          {days.map((d) => {
            const today = d === data.today;
            const count = byDay.get(d)!.length;
            return (
              <a
                key={d}
                href={`#d-${d}`}
                className={`flex flex-col items-center rounded-[12px] py-2 ${today ? "bg-orange text-ink hover:text-ink" : "bg-surface text-text hover:text-text"} ${count === 0 && !today ? "opacity-60" : ""}`}
              >
                <span className="text-[12px] font-bold">{dayLabel(d, { weekday: "short" })}</span>
                <span className="text-[20px] leading-tight font-extrabold">{Number(d.slice(8))}</span>
              </a>
            );
          })}
        </nav>

        {weekTotal === 0 ? (
          <div className="mt-5">
            <EmptyState title="Nothing on the calendar this week">
              {service || dubOnly ? "Try another service or remove the filter." : "We record every change the moment our daily check sees it."}
            </EmptyState>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-5 lg:hidden">
          {days.map((d) => {
            const items = byDay.get(d)!;
            if (items.length === 0) return null;
            return (
              <div key={d} id={`d-${d}`} className="scroll-mt-20">
                <h2 lang="en" className="mb-2.5 text-xs font-extrabold tracking-[0.08em] text-text-2 uppercase">
                  {dayLabel(d, { weekday: "long", month: "short", day: "numeric" })}
                  {d === data.today ? " · Today" : ""}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {items.map((it) => (
                    <li key={it.key}>
                      <RowCard item={it} edition={e} today={data.today} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Desktop: 7 columns */}
        {weekTotal > 0 ? (
          <div className="hidden grid-cols-7 gap-3 lg:grid">
            {days.map((d) => {
              const today = d === data.today;
              return (
                <div key={d} className="flex min-w-0 flex-col gap-2.5">
                  <div className={`flex items-baseline gap-1.5 rounded-card px-3 py-3 ${today ? "bg-orange text-ink" : "bg-surface"}`}>
                    <span className="text-sm font-bold">{dayLabel(d, { weekday: "short" })}</span>
                    <span className="text-xl leading-none font-extrabold">{Number(d.slice(8))}</span>
                    {today ? (
                      <span lang="en" className="ml-auto text-[11px] font-extrabold tracking-wide uppercase">
                        Today
                      </span>
                    ) : null}
                  </div>
                  {byDay.get(d)!.map((it) => (
                    <CalendarCard key={it.key} item={it} edition={e} />
                  ))}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* ── Leaving soon + digest ── */}
      <div className="mx-auto grid max-w-site grid-cols-1 gap-6 px-4 pt-10 pb-12 md:px-7 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,580px)] lg:gap-7">
        <section aria-labelledby="leaving" className="min-w-0">
          <div className="mb-3.5 flex items-baseline gap-3">
            <h2 id="leaving" className="text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
              Leaving soon
            </h2>
            <span className="text-sm text-text-2">Next 30 days · sorted by date</span>
          </div>
          {data.leavingSoon.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-8 text-sm text-text-2">Nothing announced to leave in the next 30 days.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.leavingSoon.map((it) => {
                const left = Math.max(0, daysUntil(`${it.day}T23:59:59+03:00`));
                return (
                  <li key={it.key} className="flex items-center gap-3 rounded-card bg-surface p-3 md:gap-4 md:px-3.5">
                    <Link href={paths.title(e, it.card.type, it.card.slug)} className="w-11 shrink-0">
                      <PosterImage path={it.card.posterPath} alt={it.card.name} sizes="44px" className="rounded-[8px]!" />
                    </Link>
                    <div className="min-w-0 grow">
                      <Link href={paths.title(e, it.card.type, it.card.slug)} className="block truncate text-base font-extrabold md:text-[17px]">
                        {it.card.name}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-text-2">
                        <ServiceLogo {...it.service} size={16} />
                        <span className="truncate">
                          {it.service.name} · leaves {formatDate(it.date, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                          <span className="text-leaving sm:hidden"> · {left === 0 ? "last day" : `${left}d left`}</span>
                        </span>
                      </p>
                    </div>
                    <span className="hidden shrink-0 sm:block">
                      <LeavingBadge>{left <= 1 ? (left === 0 ? "last day" : "1 day left") : `${left} days left`}</LeavingBadge>
                    </span>
                    <AlertButton
                      title={{ id: it.card.id, type: it.card.type, slug: it.card.slug, name: it.card.name, posterPath: it.card.posterPath, year: it.card.year }}
                      alert="leaving"
                      label="Remind me"
                      activeLabel="✓ Reminding"
                      size="sm"
                      className="shrink-0"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="self-start rounded-panel bg-orange-deep p-5 md:p-6">
          <h2 className="text-xl font-extrabold">Get this every Friday</h2>
          <p className="mt-2 text-[15px] text-text-2">
            New {term} releases and what&apos;s leaving your services — one short Telegram message or weekly email (Friday 18:00).
          </p>
          <Link
            href={`${e.routes.myList}#alerts`}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-button bg-orange text-base font-extrabold text-ink hover:bg-orange-hover hover:text-ink"
          >
            Set up alerts
          </Link>
          <p className="mt-3 text-xs text-text-3">Max 3 Telegram messages a day. Unsubscribe any time.</p>
        </aside>
      </div>
    </>
  );
}

function kindBadge(item: CalendarItem) {
  if (item.kind === "new_dub") return <NewBadge>NEW DUB</NewBadge>;
  if (item.kind === "new") return <NewBadge className="bg-available!">NEW</NewBadge>;
  return <LeavingBadge>LEAVING</LeavingBadge>;
}

/** Desktop calendar cell. New dubs get a dub-blue outline (the wedge). */
function CalendarCard({ item, edition }: { item: CalendarItem; edition: Edition }) {
  const border = item.kind === "new_dub" ? "border-dub/70" : item.kind === "leaving" ? "border-leaving/35" : "border-line-soft";
  return (
    <Link
      href={paths.title(edition, item.card.type, item.card.slug)}
      className={`flex gap-2.5 rounded-card border bg-surface p-2 hover:text-text ${border}`}
    >
      <PosterImage path={item.card.posterPath} alt="" sizes="56px" className="w-[54px] shrink-0 self-start rounded-[8px]!" />
      <div className="min-w-0 py-0.5">
        {kindBadge(item)}
        <p className="mt-1 line-clamp-3 text-sm leading-tight font-extrabold">{item.card.name}</p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-text-2">
          <ServiceLogo {...item.service} size={14} />
          <span className="truncate">{item.service.name}</span>
        </p>
      </div>
    </Link>
  );
}

/** Mobile row. */
function RowCard({ item, edition, today }: { item: CalendarItem; edition: Edition; today: string }) {
  const href = paths.title(edition, item.card.type, item.card.slug);
  const left = daysUntil(`${item.day}T23:59:59+03:00`);
  const sub =
    item.kind === "leaving"
      ? `leaves ${formatDate(item.date, { day: "numeric", month: "short", timeZone: "UTC" })}`
      : item.kind === "new_dub"
        ? `new ${dubTerm(edition.contentLang)}`
        : "new";
  return (
    <div className={`flex items-center gap-3 rounded-card border bg-surface p-2.5 ${item.kind === "new_dub" ? "border-dub/70" : "border-transparent"}`}>
      <Link href={href} className="w-[52px] shrink-0">
        <PosterImage path={item.card.posterPath} alt={item.card.name} sizes="52px" className="rounded-[8px]!" />
      </Link>
      <div className="min-w-0 grow">
        <Link href={href} className="block truncate text-base font-extrabold">
          {item.card.name}
        </Link>
        <p className="mt-0.5 truncate text-[13px] text-text-2">
          {item.service.name} · {sub}
        </p>
        <div className="mt-1.5">
          {item.kind === "leaving" ? (
            <LeavingBadge>{item.day < today ? "LEFT" : left <= 0 ? "LAST DAY" : left === 1 ? "LEAVING TOMORROW" : `LEAVING IN ${left} DAYS`}</LeavingBadge>
          ) : (
            kindBadge(item)
          )}
        </div>
      </div>
      {item.kind === "leaving" && item.day >= today ? (
        <AlertButton
          title={{ id: item.card.id, type: item.card.type, slug: item.card.slug, name: item.card.name, posterPath: item.card.posterPath, year: item.card.year }}
          alert="leaving"
          label="Remind"
          activeLabel="✓ Set"
          variant="link"
          className="shrink-0 px-1"
        />
      ) : null}
    </div>
  );
}
