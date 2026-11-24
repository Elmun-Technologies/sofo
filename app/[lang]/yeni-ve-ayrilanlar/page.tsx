import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, BellIcon } from "@/components/icons";
import { ButtonLink, iconButtonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { AlertButton } from "@/components/value/alert-button";
import { hrefWith, one, Segmented, ServiceChips, ToggleChip } from "@/components/value/filters";
import { SectionHead, Stat, Stats, ValueHero } from "@/components/value/layout";
import { CardLang } from "@/components/value/watch";
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

const KIND_DOT = { new_dub: "bg-dub", new: "bg-white", leaving: "bg-leaving" } as const;

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
  const weekItems = [...byDay.values()].flat();
  const weekTotal = weekItems.length;
  const term = dubTerm(e.contentLang);
  const langLabel = langName(e.contentLang);
  const count = (k: CalendarItem["kind"]) => weekItems.filter((i) => i.kind === k).length;
  const weekName = week === "onceki" ? "Last week" : week === "sonraki" ? "Next week" : "This week";

  return (
    <>
      <ValueHero
        tags={
          <>
            <span className="tag tnum">
              {weekName} · {rangeLabel(days)}
            </span>
            <span className="tag">Checked daily</span>
          </>
        }
        title={
          <>
            New &amp; leaving <span className="text-text-3">in {e.countryName}</span>
          </>
        }
        intro={
          <>
            What landed on legal services, what just got <span lang={e.hreflang}>{term}</span>, and the last day for everything about to leave.
          </>
        }
        aside={
          <Stats>
            <Stat value={count("new")} label="New" dot="bg-white" />
            <Stat value={count("new_dub")} label="New dubs" dot="bg-dub" />
            <Stat value={count("leaving")} label="Leaving" dot="bg-leaving" />
          </Stats>
        }
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <Segmented
            label="Week"
            className="max-lg:flex max-lg:w-full"
            options={[
              { href: hrefWith(base, current, { hafta: "onceki" }), label: "Last week", active: week === "onceki" },
              { href: hrefWith(base, current, { hafta: null }), label: "This week", active: !week },
              { href: hrefWith(base, current, { hafta: "sonraki" }), label: "Next week", active: week === "sonraki" },
            ]}
          />
          <ServiceChips services={services} active={service} hrefFor={(slug) => hrefWith(base, current, { servis: slug })} className="min-w-0 lg:flex-1" />
          <div className="shrink-0">
            <ToggleChip href={hrefWith(base, current, { dublaj: dubOnly ? null : "1" })} active={dubOnly} dot="bg-dub">
              Only {langLabel} dub
            </ToggleChip>
          </div>
        </div>
      </ValueHero>

      {/* ── Week schedule ── */}
      <section aria-label={`Week of ${rangeLabel(days)}`} className="wrap pt-6 md:pt-8">
        {/* Day strip: the week at a glance, each day jumps to its rows */}
        <nav aria-label="Days">
          <ul className="grid grid-cols-7 gap-1.5 md:gap-2">
            {days.map((d) => {
              const today = d === data.today;
              const items = byDay.get(d)!;
              const cell = `flex h-full flex-col items-center gap-0.5 rounded-[14px] px-1 py-2.5 md:items-start md:gap-1 md:rounded-card md:px-4 md:py-3.5 ${
                today ? "bg-white text-ink hover:text-ink" : items.length ? "bg-surface text-text ring-1 ring-hairline ring-inset hover:bg-surface-2 hover:text-text" : "text-text-3 ring-1 ring-hairline ring-inset"
              }`;
              const inner = (
                <>
                  <span className={`text-[11px] leading-4 md:text-[13px] ${today ? "text-ink/70" : "text-text-3"}`}>{dayLabel(d, { weekday: "short" })}</span>
                  <span className="tnum text-xl leading-none font-normal tracking-[-0.04em] md:text-[32px]">{Number(d.slice(8))}</span>
                  <span className="mt-1 flex h-1.5 items-center gap-1 md:mt-2" aria-hidden="true">
                    {items.slice(0, 4).map((it) => (
                      <span key={it.key} className={`size-1.5 rounded-full ${today && it.kind === "new" ? "bg-ink" : KIND_DOT[it.kind]}`} />
                    ))}
                  </span>
                  <span className="sr-only">
                    {today ? " (today)" : ""}, {items.length} {items.length === 1 ? "title" : "titles"}
                  </span>
                </>
              );
              return (
                <li key={d}>
                  {items.length ? (
                    <a href={`#d-${d}`} className={cell}>
                      {inner}
                    </a>
                  ) : (
                    <span className={cell}>{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-3" aria-hidden="true">
            <Legend dot="bg-white" label="New on a service" />
            <Legend dot="bg-dub" label={`New ${langLabel} dub`} />
            <Legend dot="bg-leaving" label="Last day" />
          </p>
        </nav>

        {weekTotal === 0 ? (
          <div className="mt-6 md:mt-8">
            <EmptyState title="Nothing on the calendar this week">
              {service || dubOnly ? "Try another service or remove the filter." : "We record every change the moment our daily check sees it."}
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 md:mt-12">
            {days.map((d) => {
              const items = byDay.get(d)!;
              if (items.length === 0) return null;
              const today = d === data.today;
              return (
                <section key={d} id={`d-${d}`} aria-labelledby={`h-${d}`} className="scroll-mt-24 border-t border-hairline-strong pt-4 pb-6 md:grid md:grid-cols-[168px_minmax(0,1fr)] md:gap-x-8 md:pt-6 md:pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <h2 id={`h-${d}`} className="mb-2 flex items-center gap-3 md:mb-0 md:flex-col md:items-start md:gap-2">
                    <span className="sr-only">
                      {dayLabel(d, { weekday: "long", month: "short", day: "numeric" })}
                      {today ? " · Today" : ""}
                    </span>
                    <span aria-hidden="true" className="tnum text-[40px] leading-none font-normal tracking-[-0.05em] md:text-[64px]">
                      {Number(d.slice(8))}
                    </span>
                    <span aria-hidden="true" className="text-sm leading-5 text-text-2 md:text-[15px]">
                      {dayLabel(d, { weekday: "long" })}
                      <span className="text-text-3">, {dayLabel(d, { month: "short" })}</span>
                    </span>
                    {today ? (
                      <span aria-hidden="true" className="tag ml-auto border-white/40 text-text md:mt-1 md:ml-0">
                        Today
                      </span>
                    ) : null}
                  </h2>
                  <ul className="divide-y divide-hairline">
                    {items.map((it) => (
                      <li key={it.key}>
                        <ScheduleRow item={it} edition={e} today={data.today} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Leaving soon + digest ── */}
      <div className="wrap grid grid-cols-1 gap-x-8 gap-y-10 pt-10 pb-14 md:pt-16 md:pb-24 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-x-14">
        <section aria-labelledby="leaving" className="min-w-0">
          <SectionHead id="leaving" title="Leaving soon" sub="Next 30 days · sorted by date" />
          {data.leavingSoon.length === 0 ? (
            <p className="rounded-card border border-dashed border-hairline-strong px-5 py-8 text-sm text-text-2">Nothing announced to leave in the next 30 days.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {data.leavingSoon.map((it) => {
                const left = Math.max(0, daysUntil(`${it.day}T23:59:59+03:00`));
                const href = paths.title(e, it.card.type, it.card.slug);
                const saved = { id: it.card.id, type: it.card.type, slug: it.card.slug, name: it.card.name, posterPath: it.card.posterPath, year: it.card.year };
                return (
                  <li key={it.key} className="flex items-center gap-3 py-3.5 md:gap-5 md:py-4">
                    <p className="w-12 shrink-0 md:w-[72px]" title={left === 0 ? "Last day" : `${left} ${left === 1 ? "day" : "days"} left`}>
                      <span className="tnum block text-[28px] leading-none font-normal tracking-[-0.05em] text-leaving md:text-[40px]">{left}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-text-3">{left === 0 ? "last day" : left === 1 ? "day left" : "days left"}</span>
                    </p>
                    <Link href={href} className="w-11 shrink-0 md:w-12" tabIndex={-1} aria-hidden="true">
                      <PosterImage path={it.card.posterPath} alt="" sizes="48px" className="rounded-[8px]" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={href} className="block truncate text-[15px] leading-6 font-medium md:text-[17px]">
                        {it.card.name}
                      </Link>
                      <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[13px] leading-5 text-text-2">
                        <ServiceLogo {...it.service} size={18} />
                        <span className="truncate">
                          {it.service.name}
                          <span className="tnum text-text-3"> · last day {formatDate(it.date, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</span>
                        </span>
                      </p>
                    </div>
                    <div className="w-[220px] shrink-0 max-xl:hidden">
                      <CardLang dub={it.card.dub} sub={it.card.sub} edition={e} />
                    </div>
                    <AlertButton title={saved} alert="leaving" label="Remind me" activeLabel="Reminding" variant="ghost" size="sm" className="max-sm:hidden" />
                    <AlertButton title={saved} alert="leaving" label="Remind me" activeLabel="Reminding" iconOnly className="sm:hidden" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="panel self-start p-6 md:p-8 lg:sticky lg:top-24">
          <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full ring-1 ring-hairline-strong ring-inset">
            <BellIcon className="size-5" />
          </span>
          <h2 className="text-h2 mt-6">Get this every Friday</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-2">
            New <span lang={e.hreflang}>{term}</span> releases and what&apos;s leaving your services — one short Telegram message or weekly email (Friday 18:00).
          </p>
          <ButtonLink href={`${e.routes.myList}#alerts`} size="lg" className="mt-6 w-full">
            Set up alerts
          </ButtonLink>
          <p className="mt-4 text-xs text-text-3">Max 3 Telegram messages a day. Unsubscribe any time.</p>
        </aside>
      </div>
    </>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/** One schedule entry: poster, name, what happened on which service, language status, the date that matters, one action. */
function ScheduleRow({ item, edition, today }: { item: CalendarItem; edition: Edition; today: string }) {
  const { card, service, kind } = item;
  const href = paths.title(edition, card.type, card.slug);
  const left = daysUntil(`${item.day}T23:59:59+03:00`);
  const gone = kind === "leaving" && item.day < today;
  const upcoming = kind === "leaving" && !gone;
  const date = formatDate(item.date, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const meta = [card.type === "tv" ? "Series" : "Movie", card.year, card.genres[0]].filter(Boolean).join(" · ");
  const saved = { id: card.id, type: card.type, slug: card.slug, name: card.name, posterPath: card.posterPath, year: card.year };

  const what =
    kind === "new_dub" ? (
      <>
        New <span lang={edition.hreflang}>{dubTerm(edition.contentLang)}</span>
      </>
    ) : kind === "new" ? (
      "New"
    ) : gone ? (
      "Left"
    ) : (
      "Leaving"
    );
  const when = kind === "leaving" ? (gone ? `left ${date}` : `last day ${date}`) : `added ${date}`;
  const countdown = left <= 0 ? "Last day" : left === 1 ? "Tomorrow" : `${left} days left`;

  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-3.5 py-3.5 md:grid-cols-[56px_minmax(0,1.5fr)_minmax(0,1.2fr)_auto] md:gap-x-5 md:py-4 xl:grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_160px]">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <PosterImage path={card.posterPath} alt="" sizes="56px" className="rounded-[8px]" />
      </Link>

      <div className="min-w-0">
        <Link href={href} className="block truncate text-[15px] leading-6 font-medium md:text-[17px]">
          {card.name}
        </Link>
        <p className="tnum truncate text-[13px] leading-5 text-text-3 max-xl:hidden">{meta}</p>
        {/* Phones: the event collapses under the name (the day heading already carries the date) */}
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-text-2 md:hidden">
          <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${gone ? "bg-text-3" : KIND_DOT[kind]}`} />
          <span className={`shrink-0 ${upcoming ? "text-leaving" : "text-text"}`}>{what}</span>
          <span className="tnum truncate text-text-3">
            · {service.name}
            {upcoming ? ` · ${countdown.toLowerCase()}` : ""}
          </span>
        </p>
        <CardLang dub={card.dub} sub={card.sub} edition={edition} className="mt-1 xl:hidden" />
      </div>

      <div className="flex min-w-0 items-center gap-3 max-md:hidden">
        <ServiceLogo {...service} size={32} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm leading-5 font-medium">
            <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${gone ? "bg-text-3" : KIND_DOT[kind]}`} />
            <span className={`truncate ${upcoming ? "text-leaving" : gone ? "text-text-2" : ""}`}>
              {what}
              {upcoming ? <span className="tnum font-normal"> · {countdown.toLowerCase()}</span> : null}
            </span>
          </p>
          <p className="tnum truncate text-[13px] leading-5 text-text-3">
            {service.name} · {when}
          </p>
        </div>
      </div>

      <div className="min-w-0 max-xl:hidden">
        <CardLang dub={card.dub} sub={card.sub} edition={edition} />
      </div>

      <div className="flex items-center justify-end gap-3">
        {upcoming ? (
          <>
            <AlertButton title={saved} alert="leaving" label="Remind me" activeLabel="Reminding" variant="ghost" size="sm" className="max-md:hidden" />
            <AlertButton title={saved} alert="leaving" label="Remind me" activeLabel="Reminding" iconOnly className="md:hidden" />
          </>
        ) : (
          <>
            <Link href={href} className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium whitespace-nowrap text-text ring-1 ring-hairline-strong ring-inset transition duration-200 ease-out hover:bg-white/6 hover:ring-white/30 max-md:hidden">
              Where to watch
              <ArrowRightIcon className="size-3.5" />
            </Link>
            <Link href={href} aria-label={`Where to watch ${card.name}`} className={`${iconButtonClass("md", "outline")} md:hidden`}>
              <ArrowRightIcon className="size-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
