"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowUpRightIcon, BellIcon, BookmarkIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, EyeIcon, InfoIcon, XIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { AlertToggles } from "@/components/retention/alert-toggles";
import { useHydrated } from "@/components/retention/dialog";
import { NotifySheet } from "@/components/retention/notify-me";
import { SubscribeForm } from "@/components/retention/subscribe-form";
import { buttonClass } from "@/components/ui/button";
import { Chip, ChipRow } from "@/components/ui/chip";
import { PosterImage } from "@/components/ui/poster-image";
import { ServiceLogo } from "@/components/ui/service-logo";
import { alertKindBadge, isAlertKind } from "@/lib/alerts/kinds";
import { itemStatus, type FreshTitle, type ItemStatus, type ListEvent, type TitlesResponse } from "@/lib/alerts/my-list";
import { usePrefs } from "@/lib/client/prefs";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";
import type { Edition } from "@/lib/editions";
import { checkedLabel } from "@/lib/format";
import { langName } from "@/lib/lang";

type Ed = Pick<Edition, "code" | "country" | "countryName" | "contentLang" | "coreServices" | "routes">;
type Svc = { slug: string; name: string; logoPath: string | null };
type Tab = "watchlist" | "alerts" | "watched" | "services";
type Sort = "available" | "added" | "az";

const STREAM = new Set(["subscription", "free", "ads"]);

function useHash(): string {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash,
    () => "",
  );
}

export function MyListClient({ edition, services }: { edition: Ed; services: Svc[] }) {
  const hydrated = useHydrated();
  const list = useWatchlist();
  const [prefs, setPrefs] = usePrefs();
  const hash = useHash();
  const [tabState, setTab] = useState<Tab | null>(null);
  const tab: Tab = tabState ?? (hash === "#alerts" ? "alerts" : "watchlist");
  const [sort, setSort] = useState<Sort>("available");
  const [onlyMine, setOnlyMine] = useState(false);
  const [notifyFor, setNotifyFor] = useState<SavedTitle | null>(null);
  const [data, setData] = useState<{ titles: Map<number, FreshTitle>; events: ListEvent[]; key: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const items = hydrated ? list.items : [];
  const key = items
    .map((i) => i.id)
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/titles?ids=${key}&lang=${edition.code}&events=1`)
      .then((r) => (r.ok ? (r.json() as Promise<TitlesResponse>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!cancelled) setData({ titles: new Map(d.titles.map((t) => [t.id, t])), events: d.events ?? [], key });
      })
      .catch(() => {
        if (!cancelled) setFailed(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key, edition.code]);

  const my = prefs.services;
  const fresh = (id: number) => data?.titles.get(id);
  const statusOf = (id: number): ItemStatus | null => {
    const f = fresh(id);
    return f ? itemStatus(f, { myServices: my, lang: edition.contentLang, countryName: edition.countryName }) : null;
  };
  const tonight = (id: number) => !!fresh(id)?.offers.some((o) => my.includes(o.serviceSlug) && STREAM.has(o.type));

  const watchlist = items.filter((i) => !i.watched);
  const watched = items.filter((i) => i.watched);
  const withAlerts = items.filter((i) => (i.alerts?.length ?? 0) > 0);
  const tonightCount = watchlist.filter((i) => tonight(i.id)).length;

  const sorted = useMemo(() => {
    const base = tab === "watched" ? watched : watchlist;
    const filtered = onlyMine ? base.filter((i) => tonight(i.id)) : base;
    const rank = (i: SavedTitle) => (tonight(i.id) ? 0 : (fresh(i.id)?.offers.length ?? 0) > 0 ? 1 : 2);
    return [...filtered].sort((a, b) =>
      sort === "az" ? a.name.localeCompare(b.name, edition.contentLang) : sort === "added" ? b.addedAt.localeCompare(a.addedAt) : rank(a) - rank(b) || b.addedAt.localeCompare(a.addedAt),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, items, onlyMine, sort, data, my]);

  const toggleService = (slug: string) => setPrefs((p) => ({ ...p, services: p.services.includes(slug) ? p.services.filter((s) => s !== slug) : [...p.services, slug] }));
  const loading = !!key && !data && failed !== key;

  const tabs: { id: Tab; label: string; count?: number; desktopOnly?: boolean }[] = [
    { id: "watchlist", label: "Watchlist", count: watchlist.length },
    { id: "alerts", label: "Alerts", count: withAlerts.length },
    { id: "watched", label: "Watched", count: watched.length },
    { id: "services", label: "My services", count: my.length },
  ];

  return (
    <div className="wrap pt-6 pb-12 md:pt-12 md:pb-24">
      <header>
        <p lang="en" className="overline text-text-3">
          Saved on this device · no account
        </p>
        <h1 className="text-h1 mt-3">My list</h1>
      </header>

      <div className="mt-6 flex items-center gap-3 md:mt-8">
        <ChipRow className="min-w-0 flex-1">
          {tabs.map((t) => (
            <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {hydrated && t.count ? <span className={`tnum ${tab === t.id ? "text-ink/55" : "text-text-3"}`}>{t.count}</span> : null}
            </Chip>
          ))}
        </ChipRow>
        {tab === "watchlist" || tab === "watched" ? (
          <label className="relative hidden shrink-0 md:block">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 appearance-none rounded-full bg-transparent pr-9 pl-4 text-[13px] font-medium text-text-2 ring-1 ring-hairline-strong outline-none transition duration-200 ring-inset hover:bg-white/6 hover:text-text hover:ring-white/30 focus-visible:ring-2 focus-visible:ring-white"
            >
              <option value="available">Sort: Available first</option>
              <option value="added">Sort: Recently added</option>
              <option value="az">Sort: A–Z</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-text-3" />
          </label>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 border-t border-hairline-strong pt-6 md:mt-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
        <div className="min-w-0">
          {!hydrated ? (
            <ListSkeleton />
          ) : tab === "services" ? (
            <section aria-labelledby="svc-h">
              <h2 id="svc-h" className="text-h2">
                My services
              </h2>
              <p className="mt-2 max-w-md text-[15px] text-text-2">We show what you can watch tonight first. Stored on this device only.</p>
              <ServiceToggles services={services} selected={my} onToggle={toggleService} className="panel mt-6 max-w-xl p-2" />
            </section>
          ) : tab === "alerts" ? (
            <AlertsTab
              edition={edition}
              items={items}
              events={data?.events ?? []}
              loading={loading}
              statusOf={statusOf}
              onChange={(id, alerts) => list.update(id, { alerts })}
            />
          ) : items.length === 0 ? (
            <EmptyList edition={edition} />
          ) : (
            <>
              {tab === "watchlist" ? (
                <TonightBanner
                  hasServices={my.length > 0}
                  count={tonightCount}
                  total={watchlist.length}
                  loading={loading}
                  onlyMine={onlyMine}
                  onToggle={() => setOnlyMine((v) => !v)}
                  onPickServices={() => setTab("services")}
                />
              ) : null}
              {failed === key && !data ? (
                <p className="mb-5 flex items-start gap-3 rounded-card border border-leaving/30 px-4 py-3.5 text-sm text-leaving">
                  <InfoIcon className="mt-0.5 size-4 shrink-0" />
                  <span>We couldn&apos;t refresh availability right now — showing your saved titles. Try again in a minute.</span>
                </p>
              ) : null}
              {sorted.length === 0 ? (
                <div className="rounded-panel border border-dashed border-hairline-strong px-6 py-14 text-center text-[15px] text-text-2">
                  {tab === "watched" ? "Nothing marked as watched yet." : "None of these are on your services tonight."}
                </div>
              ) : (
                <>
                  <ul className="hidden grid-cols-3 gap-x-4 gap-y-9 sm:grid md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                    {sorted.map((i) => (
                      <GridItem
                        key={i.id}
                        item={i}
                        fresh={fresh(i.id)}
                        status={statusOf(i.id)}
                        loading={loading}
                        edition={edition}
                        onNotify={() => setNotifyFor(i)}
                        onWatched={() => list.update(i.id, { watched: !i.watched })}
                        onRemove={() => list.remove(i.id)}
                      />
                    ))}
                  </ul>
                  <ul className="panel divide-y divide-hairline sm:hidden">
                    {sorted.map((i) => (
                      <RowItem key={i.id} item={i} fresh={fresh(i.id)} status={statusOf(i.id)} loading={loading} onNotify={() => setNotifyFor(i)} onRemove={() => list.remove(i.id)} />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 md:gap-4" aria-label="Alerts and services">
          {hydrated && items.length > 0 ? (
            <section className="panel hidden p-2 lg:block" aria-labelledby="notif-h">
              <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1.5">
                <h2 id="notif-h" className="text-h3">
                  Alerts
                </h2>
                <button type="button" className={`${buttonClass("quiet", "sm")} -mr-2`} onClick={() => setTab("alerts")}>
                  Settings
                </button>
              </div>
              <EventList events={(data?.events ?? []).slice(0, 4)} loading={loading} />
            </section>
          ) : null}
          <section className="panel hidden p-2 lg:block" aria-labelledby="svc-side-h">
            <div className="px-4 pt-3.5 pb-2">
              <h2 id="svc-side-h" className="text-h3">
                My services
              </h2>
              <p className="mt-0.5 text-xs text-text-3">What you can watch tonight comes first.</p>
            </div>
            <ServiceToggles services={services} selected={hydrated ? my : []} onToggle={toggleService} />
          </section>
          <SubscribeForm
            variant="card"
            edition={edition.code}
            submitLabel="Connect"
            alerts={withAlerts.map((i) => ({ titleId: i.id, kinds: (i.alerts ?? []).filter(isAlertKind) }))}
          />
        </aside>
      </div>

      {notifyFor ? (
        <NotifySheet
          title={notifyFor}
          serviceName={statusOf(notifyFor.id)?.offer?.serviceName}
          subtitle={statusOf(notifyFor.id)?.label}
          onClose={() => setNotifyFor(null)}
        />
      ) : null}
    </div>
  );
}

function TonightBanner(p: { hasServices: boolean; count: number; total: number; loading: boolean; onlyMine: boolean; onToggle: () => void; onPickServices: () => void }) {
  const ready = p.hasServices && !p.loading;
  return (
    <div className="panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 md:mb-8 md:px-7 md:py-6">
      {ready ? (
        <span aria-hidden="true" className="tnum shrink-0 text-[44px] leading-none font-normal tracking-[-0.05em] md:text-[56px]">
          {p.count}
          <span className="text-text-3">/{p.total}</span>
        </span>
      ) : null}
      <p className="flex-1 text-[15px] text-text-2 md:text-base" aria-live="polite">
        {!p.hasServices ? (
          <>
            <span className="block text-h3 text-text">What can you watch tonight?</span>
            <span className="mt-1 block">Tell us which services you have — we&apos;ll show what you can watch tonight.</span>
          </>
        ) : p.loading ? (
          "Checking your services…"
        ) : (
          <>
            <span className="sr-only">
              {p.count} of your {p.total} title{p.total === 1 ? "" : "s"}{" "}
            </span>
            <span className="block text-h3 text-text">Ready to watch tonight</span>
            <span className="mt-1 block">
              <span aria-hidden="true">
                {p.count} of your {p.total} title{p.total === 1 ? "" : "s"}{" "}
              </span>
              can be watched tonight on services you have.
            </span>
          </>
        )}
      </p>
      {p.hasServices ? (
        <button type="button" aria-pressed={p.onlyMine} onClick={p.onToggle} className={`${buttonClass(p.onlyMine ? "secondary" : "primary", "md")} self-start sm:self-auto`}>
          {p.onlyMine ? "Show all" : "Show only these"}
        </button>
      ) : (
        <button type="button" onClick={p.onPickServices} className={`${buttonClass("primary", "md")} self-start sm:self-auto`}>
          Pick my services
        </button>
      )}
    </div>
  );
}

const TONE_DOT: Record<ItemStatus["tone"], string> = {
  available: "bg-available",
  leaving: "bg-leaving",
  free: "bg-free",
  muted: "bg-white/30",
};

/** One-line status: a 6 px semantic dot + text (never a solid fill). */
function StatusPill({ status, loading }: { status: ItemStatus | null; loading: boolean }) {
  if (!status) return loading ? <span className="inline-block h-3 w-28 animate-pulse rounded-full bg-white/8 align-middle" aria-label="Checking availability" /> : null;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 text-xs leading-[18px] font-medium ${status.tone === "leaving" ? "text-leaving" : status.tone === "muted" ? "text-text-3" : "text-text-2"}`}>
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${TONE_DOT[status.tone]}`} />
      <span className="truncate">{status.label}</span>
      {status.check ? (
        <span role="img" aria-label="confirmed" className="inline-flex shrink-0 text-available">
          <CheckIcon className="size-3 stroke-[3]" />
        </span>
      ) : null}
    </span>
  );
}

type ItemProps = { item: SavedTitle; fresh: FreshTitle | undefined; status: ItemStatus | null; loading: boolean; onNotify: () => void; onRemove: () => void };

function GridItem({ item, fresh, status, loading, edition, onNotify, onWatched, onRemove }: ItemProps & { edition: Ed; onWatched: () => void }) {
  const href = fresh?.href ?? `/${edition.code}/${item.type === "movie" ? "film" : "dizi"}/${item.slug}`;
  const o = status?.offer;
  const active = (item.alerts?.length ?? 0) > 0;
  return (
    <li className="group flex min-w-0 flex-col">
      <div className="relative">
        <Link href={href} className="block rounded-poster" tabIndex={-1} aria-hidden="true">
          <PosterImage
            path={fresh?.posterPath ?? item.posterPath}
            alt=""
            sizes="(max-width: 768px) 30vw, (max-width: 1280px) 22vw, 220px"
            imgClassName={`transition duration-500 ease-out group-hover:scale-[1.04] ${item.watched ? "opacity-45 grayscale" : ""}`}
          />
        </Link>
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <IconBtn glass label={active ? "Edit alerts" : "Notify me"} onClick={onNotify} active={active}>
            <BellIcon className="size-4" />
          </IconBtn>
          <IconBtn glass label={item.watched ? "Mark as not watched" : "Mark as watched"} onClick={onWatched} active={item.watched}>
            <EyeIcon className="size-4" />
          </IconBtn>
          <IconBtn glass label="Remove from My list" onClick={onRemove}>
            <XIcon className="size-4" />
          </IconBtn>
        </div>
      </div>
      <Link href={href} className="mt-3 block truncate text-[15px] leading-5 font-medium">
        {fresh?.name ?? item.name}
      </Link>
      <div className="mt-1 min-h-[18px]">
        <StatusPill status={status} loading={loading} />
      </div>
      {fresh?.checkedAt ? <p className="tnum text-[11px] leading-[18px] text-text-3">{checkedLabel(fresh.checkedAt)}</p> : null}
      {o ? (
        <OutboundLink
          href={o.url}
          service={o.serviceSlug}
          title={item.name}
          country={edition.country}
          lang={o.audio === "confirmed_yes" ? edition.contentLang : undefined}
          offerType={o.type}
          className={`${buttonClass("accent", "sm")} mt-3 max-w-full min-w-0 !shrink self-start`}
        >
          <span className="truncate">Watch on {o.serviceName}</span>
          <ArrowUpRightIcon className="size-3.5 shrink-0" />
        </OutboundLink>
      ) : null}
    </li>
  );
}

function RowItem({ item, fresh, status, loading, onNotify, onRemove }: ItemProps) {
  const href = fresh?.href;
  const body = (
    <>
      <div className="w-[52px] shrink-0">
        <PosterImage path={fresh?.posterPath ?? item.posterPath} alt="" sizes="52px" className="!rounded-[8px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base leading-5 font-medium">{fresh?.name ?? item.name}</p>
        <div className="mt-1 min-h-[18px]">
          <StatusPill status={status} loading={loading} />
        </div>
        {fresh?.checkedAt ? <p className="tnum text-[11px] leading-4 text-text-3">{checkedLabel(fresh.checkedAt)}</p> : null}
      </div>
    </>
  );
  return (
    <li className="flex items-center gap-1 py-3 pr-2 pl-3">
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          {body}
          <ChevronRightIcon className="size-4 shrink-0 text-text-3" />
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      <IconBtn touch label="Notify me" onClick={onNotify} active={(item.alerts?.length ?? 0) > 0}>
        <BellIcon className="size-[18px]" />
      </IconBtn>
      <IconBtn touch label={`Remove ${item.name}`} onClick={onRemove}>
        <XIcon className="size-[18px]" />
      </IconBtn>
    </li>
  );
}

function IconBtn({ label, onClick, active, touch, glass, children }: { label: string; onClick: () => void; active?: boolean; touch?: boolean; glass?: boolean; children: React.ReactNode }) {
  // On posters (glass): quiet until hover on pointer devices; an active control (alerts on, watched) always stays visible.
  const tone = active
    ? "bg-white text-ink"
    : glass
      ? "bg-black/55 text-white ring-1 ring-white/15 ring-inset backdrop-blur-md hover:bg-black/80 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
      : "text-text-2 hover:bg-white/8 hover:text-text";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition duration-200 ease-out active:scale-95 ${touch ? "size-11" : "size-9"} ${tone}`}
    >
      {children}
    </button>
  );
}

function ServiceToggles({ services, selected, onToggle, className = "" }: { services: Svc[]; selected: string[]; onToggle: (slug: string) => void; className?: string }) {
  return (
    <ul className={className}>
      {services.map((s) => {
        const on = selected.includes(s.slug);
        return (
          <li key={s.slug}>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => onToggle(s.slug)}
              className="flex w-full items-center gap-3.5 rounded-[18px] px-4 py-2.5 text-left transition-colors duration-200 hover:bg-white/5"
            >
              <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={32} />
              <span className={`flex-1 text-[15px] font-medium transition-colors ${on ? "text-text" : "text-text-2"}`}>{s.name}</span>
              <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-white" : "bg-white/12"}`}>
                <span className={`absolute top-0.5 left-0.5 size-5 rounded-full transition duration-200 ease-out ${on ? "translate-x-5 bg-ink" : "bg-white/70"}`} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function relTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 12) return `${h} h ago`;
  const d = Math.floor(diff / 86_400_000);
  if (d < 1) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Istanbul" });
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });
}

const KIND_DOT: Partial<Record<NonNullable<ListEvent["kind"]>, string>> = {
  leaving: "bg-leaving",
  price_drop: "bg-free",
  release: "bg-available",
  on_my_services: "bg-available",
};

function KindBadge({ kind }: { kind: ListEvent["kind"] }) {
  if (!kind) return null;
  return (
    <span lang="en" className="inline-flex items-center gap-2 text-[11px] leading-4 font-semibold tracking-[0.1em] text-text-2">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${KIND_DOT[kind] ?? "bg-dub"}`} />
      {alertKindBadge(kind)}
    </span>
  );
}

function EventList({ events, loading }: { events: ListEvent[]; loading: boolean }) {
  if (loading)
    return (
      <div className="grid gap-3 px-4 py-3" aria-label="Loading alerts">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-input bg-white/5" />
        ))}
      </div>
    );
  if (events.length === 0) return <p className="px-4 pt-1 pb-4 text-sm text-text-2">No changes in the last 30 days for your titles. We check every service daily.</p>;
  return (
    <ul>
      {events.map((e) => (
        <li key={e.id}>
          <Link href={e.href ?? "#"} className="block rounded-[18px] px-4 py-3 transition-colors duration-200 hover:bg-white/5">
            <span className="flex items-center justify-between gap-3">
              <KindBadge kind={e.kind} />
              <time dateTime={e.occurredAt} className="tnum ml-auto text-xs text-text-3">
                {relTime(e.occurredAt)}
              </time>
            </span>
            <span className="mt-1.5 block text-sm leading-snug font-medium">{e.headline}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AlertsTab({ edition, items, events, loading, statusOf, onChange }: { edition: Ed; items: SavedTitle[]; events: ListEvent[]; loading: boolean; statusOf: (id: number) => ItemStatus | null; onChange: (id: number, alerts: string[]) => void }) {
  if (items.length === 0) return <EmptyList edition={edition} />;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 md:gap-14">
      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="text-h2">
          Recent changes
        </h2>
        <p className="mt-2 text-[15px] text-text-2">The last 30 days for titles in your list.</p>
        <div className="panel mt-5 p-2">
          <EventList events={events} loading={loading} />
        </div>
      </section>
      <section id="alerts" aria-labelledby="follow-h" className="scroll-mt-24">
        <h2 id="follow-h" className="text-h2">
          What we tell you
        </h2>
        <p className="mt-2 text-[15px] text-text-2">Saved on this device. Connect Telegram or email to get them as messages.</p>
        <ul className="mt-5 grid gap-3 md:gap-4 xl:grid-cols-2">
          {items.map((i) => {
            const st = statusOf(i.id);
            return (
              <li key={i.id} className="panel min-w-0 p-4 md:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 shrink-0">
                    <PosterImage path={i.posterPath} alt="" sizes="44px" className="!rounded-[8px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base leading-5 font-medium">{i.name}</p>
                    <div className="mt-1 min-h-[18px]">
                      <StatusPill status={st} loading={loading} />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <AlertToggles
                    dense
                    value={i.alerts ?? []}
                    onChange={(k) => onChange(i.id, k)}
                    serviceName={st?.offer?.serviceName}
                    type={i.type}
                    langName={langName(edition.contentLang)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function EmptyList({ edition }: { edition: Ed }) {
  const steps = [
    { title: "Save", body: "Tap the bookmark on any movie or series." },
    { title: "Pick your services", body: "What you can watch tonight comes first." },
    { title: "Get alerts", body: "When it lands on your services or gets Turkish dub." },
  ];
  return (
    <div className="grid gap-3 md:gap-4">
      <div className="panel px-6 py-10 md:px-10 md:py-14">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-white/6 text-text-2">
          <BookmarkIcon className="size-5" />
        </span>
        <p className="text-h1 mt-6">Your list is empty</p>
        <p className="mt-3 max-w-md text-[15px] text-text-2 md:text-base">Tap + on any title. We&apos;ll tell you when it&apos;s on your services or gets Turkish dub.</p>
        <Link href={edition.routes.dubHub} className={`${buttonClass("primary", "lg")} mt-8`}>
          Browse popular titles
        </Link>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3 md:gap-4">
        {steps.map((s, i) => (
          <li key={s.title} className="panel flex gap-4 p-5 sm:block md:p-6">
            <span aria-hidden="true" className="tnum block w-10 shrink-0 text-[28px] leading-none font-normal tracking-[-0.04em] text-text-3 sm:w-auto">
              {String(i + 1).padStart(2, "0")}.
            </span>
            <span className="block sm:mt-8">
              <span className="block text-h3">{s.title}</span>
              <span className="mt-1 block text-sm text-text-2">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-poster bg-surface" />
      ))}
    </div>
  );
}
