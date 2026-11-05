"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { HeartIcon } from "@/components/icons";
import { OutboundLink } from "@/components/outbound-link";
import { AlertToggles } from "@/components/retention/alert-toggles";
import { useHydrated } from "@/components/retention/dialog";
import { NotifySheet } from "@/components/retention/notify-me";
import { SubscribeForm } from "@/components/retention/subscribe-form";
import { FreeBadge, LeavingBadge, MutedBadge, NewBadge } from "@/components/ui/badges";
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
    <div className="mx-auto max-w-site px-4 pt-5 pb-8 md:px-7 md:pt-8">
      <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em] md:text-[48px]">My list</h1>
      <div className="mt-4 flex items-center gap-3 md:mt-5">
        <ChipRow className="min-w-0 flex-1" >
          {tabs.map((t) => (
            <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {hydrated && t.count ? <span className={tab === t.id ? "text-ink/70" : "text-text-2"}>· {t.count}</span> : null}
            </Chip>
          ))}
        </ChipRow>
        {tab === "watchlist" || tab === "watched" ? (
          <label className="hidden shrink-0 md:block">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 rounded-chip border border-line bg-surface px-3.5 text-sm font-bold text-text outline-none focus:border-orange"
            >
              <option value="available">Sort: Available first</option>
              <option value="added">Sort: Recently added</option>
              <option value="az">Sort: A–Z</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-7">
        <div className="min-w-0">
          {!hydrated ? (
            <ListSkeleton />
          ) : tab === "services" ? (
            <section aria-labelledby="svc-h">
              <h2 id="svc-h" className="text-xl font-extrabold">
                My services
              </h2>
              <p className="mt-1 text-sm text-text-2">We show what you can watch tonight first. Stored on this device only.</p>
              <ServiceToggles services={services} selected={my} onToggle={toggleService} className="mt-4 rounded-panel border border-line bg-surface p-2" />
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
                <p className="mb-4 rounded-card border border-leaving/30 bg-leaving/10 p-3 text-sm text-leaving">
                  We couldn&apos;t refresh availability right now — showing your saved titles. Try again in a minute.
                </p>
              ) : null}
              {sorted.length === 0 ? (
                <div className="rounded-panel border border-dashed border-line px-6 py-10 text-center text-sm text-text-2">
                  {tab === "watched" ? "Nothing marked as watched yet." : "None of these are on your services tonight."}
                </div>
              ) : (
                <>
                  <ul className="hidden grid-cols-3 gap-x-4 gap-y-6 sm:grid md:grid-cols-4">
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
                  <ul className="grid gap-2.5 sm:hidden">
                    {sorted.map((i) => (
                      <RowItem key={i.id} item={i} fresh={fresh(i.id)} status={statusOf(i.id)} loading={loading} onNotify={() => setNotifyFor(i)} onRemove={() => list.remove(i.id)} />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        <aside className="grid content-start gap-5" aria-label="Alerts and services">
          {hydrated && items.length > 0 ? (
            <section className="hidden lg:block" aria-labelledby="notif-h">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="notif-h" className="text-xl font-extrabold">
                  Alerts
                </h2>
                <button type="button" className="text-sm font-bold text-text-2 hover:text-text" onClick={() => setTab("alerts")}>
                  Settings
                </button>
              </div>
              <EventList events={(data?.events ?? []).slice(0, 4)} loading={loading} />
            </section>
          ) : null}
          <section className="hidden rounded-panel border border-line bg-surface p-4 lg:block" aria-labelledby="svc-side-h">
            <h2 id="svc-side-h" className="px-1 font-extrabold">
              My services
            </h2>
            <ServiceToggles services={services} selected={hydrated ? my : []} onToggle={toggleService} className="mt-2" />
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
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-card border border-orange/20 bg-orange-deep px-4 py-3.5 sm:flex-row sm:items-center md:px-5">
      <p className="flex-1 text-sm font-bold md:text-[15px]" aria-live="polite">
        {!p.hasServices
          ? "Tell us which services you have — we'll show what you can watch tonight."
          : p.loading
            ? "Checking your services…"
            : `${p.count} of your ${p.total} title${p.total === 1 ? "" : "s"} can be watched tonight on services you have.`}
      </p>
      {p.hasServices ? (
        <button type="button" aria-pressed={p.onlyMine} onClick={p.onToggle} className={`${buttonClass(p.onlyMine ? "secondary" : "primary", "sm")} self-start sm:self-auto`}>
          {p.onlyMine ? "Show all" : "Show only these"}
        </button>
      ) : (
        <button type="button" onClick={p.onPickServices} className={`${buttonClass("primary", "sm")} self-start sm:self-auto`}>
          Pick my services
        </button>
      )}
    </div>
  );
}

const TONE: Record<ItemStatus["tone"], string> = {
  available: "bg-available/15 text-available",
  leaving: "bg-leaving text-ink",
  free: "bg-free text-ink",
  muted: "bg-surface-2 text-text",
};

function StatusPill({ status, loading }: { status: ItemStatus | null; loading: boolean }) {
  if (!status) return loading ? <span className="inline-block h-5 w-32 animate-pulse rounded-chip bg-surface-2" aria-label="Checking availability" /> : null;
  return (
    <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-chip px-2 py-0.5 text-[11px] leading-4 font-extrabold ${TONE[status.tone]}`}>
      <span className="truncate">{status.label}</span>
      {status.check ? <span aria-label="confirmed">✓</span> : null}
    </span>
  );
}

type ItemProps = { item: SavedTitle; fresh: FreshTitle | undefined; status: ItemStatus | null; loading: boolean; onNotify: () => void; onRemove: () => void };

function GridItem({ item, fresh, status, loading, edition, onNotify, onWatched, onRemove }: ItemProps & { edition: Ed; onWatched: () => void }) {
  const href = fresh?.href ?? `/${edition.code}/${item.type === "movie" ? "film" : "dizi"}/${item.slug}`;
  const o = status?.offer;
  const active = (item.alerts?.length ?? 0) > 0;
  return (
    <li className="group min-w-0">
      <Link href={href} className="block hover:text-text">
        <PosterImage path={fresh?.posterPath ?? item.posterPath} alt={item.name} className="transition group-hover:ring-2 group-hover:ring-orange" />
        <span className="mt-2 block truncate font-bold">{fresh?.name ?? item.name}</span>
      </Link>
      <div className="mt-1">
        <StatusPill status={status} loading={loading} />
      </div>
      {o ? (
        <OutboundLink
          href={o.url}
          service={o.serviceSlug}
          title={item.name}
          country={edition.country}
          lang={o.audio === "confirmed_yes" ? edition.contentLang : undefined}
          offerType={o.type}
          className="mt-1.5 inline-block text-xs font-bold text-orange hover:text-orange-tint"
        >
          Watch on {o.serviceName} ↗
        </OutboundLink>
      ) : null}
      {fresh?.checkedAt ? <p className="mt-0.5 text-[11px] text-text-3">{checkedLabel(fresh.checkedAt)}</p> : null}
      <div className="mt-2 flex gap-1.5">
        <IconBtn label={active ? "Edit alerts" : "Notify me"} onClick={onNotify} active={active}>
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
          <path d="M10 21h4" />
        </IconBtn>
        <IconBtn label={item.watched ? "Mark as not watched" : "Mark as watched"} onClick={onWatched} active={item.watched}>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </IconBtn>
        <IconBtn label="Remove from My list" onClick={onRemove}>
          <path d="M6 6l12 12M18 6 6 18" />
        </IconBtn>
      </div>
    </li>
  );
}

function RowItem({ item, fresh, status, loading, onNotify, onRemove }: ItemProps) {
  const href = fresh?.href;
  const body = (
    <>
      <div className="w-12 shrink-0">
        <PosterImage path={fresh?.posterPath ?? item.posterPath} alt="" sizes="48px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-extrabold">{fresh?.name ?? item.name}</p>
        <div className="mt-1">
          <StatusPill status={status} loading={loading} />
        </div>
      </div>
    </>
  );
  return (
    <li className="flex items-center gap-2 rounded-card bg-surface p-2.5">
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 hover:text-text">
          {body}
          <span aria-hidden="true" className="text-text-3">
            ›
          </span>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      <IconBtn label="Notify me" onClick={onNotify} active={(item.alerts?.length ?? 0) > 0}>
        <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
        <path d="M10 21h4" />
      </IconBtn>
      <IconBtn label={`Remove ${item.name}`} onClick={onRemove}>
        <path d="M6 6l12 12M18 6 6 18" />
      </IconBtn>
    </li>
  );
}

function IconBtn({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-chip transition ${active ? "bg-orange-deep text-orange" : "bg-surface-2 text-text-2 hover:text-text"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
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
            <button type="button" role="switch" aria-checked={on} onClick={() => onToggle(s.slug)} className="flex w-full items-center gap-3 rounded-button px-1 py-2 text-left hover:bg-surface-2 hover:text-text">
              <ServiceLogo slug={s.slug} name="" logoPath={s.logoPath} size={30} />
              <span className="flex-1 font-bold">{s.name}</span>
              <span aria-hidden="true" className={`relative h-6 w-11 rounded-chip transition ${on ? "bg-orange" : "bg-line"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
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

function KindBadge({ kind }: { kind: ListEvent["kind"] }) {
  if (!kind) return null;
  const label = alertKindBadge(kind);
  if (kind === "leaving") return <LeavingBadge>{label}</LeavingBadge>;
  if (kind === "price_drop") return <FreeBadge>{label}</FreeBadge>;
  if (kind === "release" || kind === "on_my_services") return <MutedBadge>{label}</MutedBadge>;
  return <NewBadge>{label}</NewBadge>;
}

function EventList({ events, loading }: { events: ListEvent[]; loading: boolean }) {
  if (loading) return <div className="h-40 animate-pulse rounded-card bg-surface" aria-label="Loading alerts" />;
  if (events.length === 0)
    return <p className="rounded-card bg-surface p-4 text-sm text-text-2">No changes in the last 30 days for your titles. We check every service daily.</p>;
  return (
    <ul className="grid gap-2.5">
      {events.map((e) => (
        <li key={e.id}>
          <Link href={e.href ?? "#"} className="block rounded-card bg-surface p-3.5 hover:bg-surface-2 hover:text-text">
            <span className="flex items-center justify-between gap-2">
              <KindBadge kind={e.kind} />
              <time dateTime={e.occurredAt} className="text-xs text-text-3">
                {relTime(e.occurredAt)}
              </time>
            </span>
            <span className="mt-1.5 block text-sm font-bold">{e.headline}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AlertsTab({ edition, items, events, loading, statusOf, onChange }: { edition: Ed; items: SavedTitle[]; events: ListEvent[]; loading: boolean; statusOf: (id: number) => ItemStatus | null; onChange: (id: number, alerts: string[]) => void }) {
  if (items.length === 0) return <EmptyList edition={edition} />;
  return (
    <div className="grid gap-8">
      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="mb-3 text-xl font-extrabold">
          Recent changes
        </h2>
        <EventList events={events} loading={loading} />
      </section>
      <section id="alerts" aria-labelledby="follow-h" className="scroll-mt-24">
        <h2 id="follow-h" className="text-xl font-extrabold">
          What we tell you
        </h2>
        <p className="mt-1 text-sm text-text-2">Saved on this device. Connect Telegram or email to get them as messages.</p>
        <ul className="mt-4 grid gap-3">
          {items.map((i) => {
            const st = statusOf(i.id);
            return (
              <li key={i.id} className="rounded-panel border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 shrink-0">
                    <PosterImage path={i.posterPath} alt="" sizes="40px" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{i.name}</p>
                    <StatusPill status={st} loading={loading} />
                  </div>
                </div>
                <div className="mt-3">
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
  return (
    <div className="flex flex-col items-center rounded-panel border border-line bg-surface px-6 py-12 text-center md:py-16">
      <HeartIcon className="size-11 text-text" />
      <p className="mt-4 text-2xl font-extrabold">Your list is empty</p>
      <p className="mt-2 max-w-sm text-text-2">Tap + on any title. We&apos;ll tell you when it&apos;s on your services or gets Turkish dub.</p>
      <Link href={edition.routes.dubHub} className={`${buttonClass("primary")} mt-6`}>
        Browse popular titles
      </Link>
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
