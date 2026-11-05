/**
 * Alert dispatch planning — pure functions, no I/O (unit-tested).
 *
 * Rules (CLAUDE.md "Eslatmalar", board Alerts):
 * - One Telegram message per followed title per local day (several events for that title are grouped),
 *   so "messages sent today" = telegram alerts whose lastSentAt is today.
 * - Max 3 Telegram messages per user per local day; the rest stay pending (lastSentAt unchanged)
 *   and go out next day or in the Friday digest, whichever comes first.
 * - Email alerts are only sent in the weekly digest (Friday 18:00 Europe/Istanbul).
 * - Only events after alert.lastSentAt (or alert.createdAt) count — no history backfill.
 */
import { eventAlertKind, type AlertEvent } from "./match";
import type { AlertKindName } from "./kinds";
import { sameLocalDay, TELEGRAM_DAILY_CAP } from "./time";

export type PlanUser = { id: string; email: string | null; telegramId: string | null; countryCode: string };
export type PlanAlert = {
  id: number;
  userId: string;
  titleId: number;
  kinds: AlertKindName[];
  channel: "telegram" | "email" | "web_push";
  lastSentAt: Date | null;
  createdAt: Date;
};
export type Match = { alertId: number; kind: AlertKindName; event: AlertEvent };

/** Edition language for a country (TR → "tr"); undefined = no live edition, nothing matches. */
export type LangForCountry = (countryCode: string) => string | undefined;

export function pendingMatches(alert: PlanAlert, user: PlanUser, events: AlertEvent[], langForCountry: LangForCountry, now: Date): Match[] {
  const lang = langForCountry(user.countryCode);
  if (!lang) return [];
  const since = (alert.lastSentAt ?? alert.createdAt).getTime();
  const out: Match[] = [];
  for (const ev of events) {
    if (ev.titleId !== alert.titleId || ev.countryCode !== user.countryCode) continue;
    const t = ev.occurredAt.getTime();
    if (t <= since || t > now.getTime()) continue;
    const kind = eventAlertKind(ev, lang);
    if (kind && alert.kinds.includes(kind)) out.push({ alertId: alert.id, kind, event: ev });
  }
  return out.sort((a, b) => a.event.occurredAt.getTime() - b.event.occurredAt.getTime());
}

export type TelegramPlan = { userId: string; chatId: string; alertId: number; titleId: number; matches: Match[] };
export type PlanInput = { users: PlanUser[]; alerts: PlanAlert[]; events: AlertEvent[]; now: Date; langForCountry: LangForCountry };

export function planTelegram({ users, alerts, events, now, langForCountry, cap = TELEGRAM_DAILY_CAP }: PlanInput & { cap?: number }) {
  const messages: TelegramPlan[] = [];
  const deferred: { userId: string; alertId: number; reason: "daily_cap" | "already_sent_today" }[] = [];

  for (const user of users) {
    if (!user.telegramId) continue;
    const mine = alerts.filter((a) => a.userId === user.id && a.channel === "telegram");
    const sentToday = mine.filter((a) => a.lastSentAt && sameLocalDay(a.lastSentAt, now)).length;
    let left = Math.max(0, cap - sentToday);

    const candidates = mine
      .map((a) => ({ a, matches: pendingMatches(a, user, events, langForCountry, now) }))
      .filter((c) => c.matches.length > 0)
      .sort((x, y) => x.matches[0]!.event.occurredAt.getTime() - y.matches[0]!.event.occurredAt.getTime());

    for (const { a, matches } of candidates) {
      if (a.lastSentAt && sameLocalDay(a.lastSentAt, now)) {
        deferred.push({ userId: user.id, alertId: a.id, reason: "already_sent_today" });
      } else if (left > 0) {
        messages.push({ userId: user.id, chatId: user.telegramId, alertId: a.id, titleId: a.titleId, matches });
        left--;
      } else {
        deferred.push({ userId: user.id, alertId: a.id, reason: "daily_cap" });
      }
    }
  }
  return { messages, deferred };
}

export type DigestSections = { dubs: Match[]; leaving: Match[]; prices: Match[]; episodes: Match[]; releases: Match[] };

export function groupSections(matches: Match[]): DigestSections {
  const s: DigestSections = { dubs: [], leaving: [], prices: [], episodes: [], releases: [] };
  for (const m of matches) {
    if (m.kind === "dub_available") s.dubs.push(m);
    else if (m.kind === "leaving") s.leaving.push(m);
    else if (m.kind === "price_drop") s.prices.push(m);
    else if (m.kind === "new_episode") s.episodes.push(m);
    else s.releases.push(m);
  }
  return s;
}

export type DigestPlan = {
  userId: string;
  channel: "email" | "telegram";
  /** email address or Telegram chat id */
  to: string;
  /** Alerts included → lastSentAt is updated for these only */
  alertIds: number[];
  sections: DigestSections;
  /** This week's new edition-language dubs in the user's country (not already in `sections`) */
  newDubs: AlertEvent[];
};

const WEEK = 7 * 86_400_000;

/**
 * Weekly digest: pending matches per user and channel + general "new in <language>" dubs.
 * Telegram users get it too (Telegram "Your Friday list") — it carries what the daily cap held back.
 */
export function planDigest({ users, alerts, events, now, langForCountry, maxNewDubs = 8 }: PlanInput & { maxNewDubs?: number }): DigestPlan[] {
  const plans: DigestPlan[] = [];
  for (const user of users) {
    const lang = langForCountry(user.countryCode);
    if (!lang) continue;
    const channels: { channel: "email" | "telegram"; to: string | null }[] = [
      { channel: "email", to: user.email },
      { channel: "telegram", to: user.telegramId },
    ];
    for (const { channel, to } of channels) {
      if (!to) continue;
      const mine = alerts.filter((a) => a.userId === user.id && a.channel === channel);
      const matches: Match[] = [];
      const alertIds: number[] = [];
      for (const a of mine) {
        const m = pendingMatches(a, user, events, langForCountry, now);
        if (m.length) {
          matches.push(...m);
          alertIds.push(a.id);
        }
      }
      const seen = new Set(matches.map((m) => m.event.titleId));
      const newDubs: AlertEvent[] = [];
      for (const ev of [...events].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())) {
        if (newDubs.length >= maxNewDubs) break;
        if (ev.countryCode !== user.countryCode || seen.has(ev.titleId)) continue;
        const age = now.getTime() - ev.occurredAt.getTime();
        if (age < 0 || age > WEEK || eventAlertKind(ev, lang) !== "dub_available") continue;
        seen.add(ev.titleId);
        newDubs.push(ev);
      }
      if (matches.length === 0 && newDubs.length === 0) continue;
      plans.push({ userId: user.id, channel, to, alertIds, sections: groupSections(matches), newDubs });
    }
  }
  return plans;
}
