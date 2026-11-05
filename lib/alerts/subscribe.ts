/**
 * Alert subscriptions (server-only). No passwords, minimal personal data (KVKK).
 *
 * Email: User upserted by unique `email`; Alert.channel = email. Double opt-in is a placeholder until an
 * email provider exists — the address is stored, the confirmation is only logged, and the dispatcher
 * never emails anyone (dry-run) in that state.
 *
 * Telegram: the schema only has `telegram_id` (a numeric chat id). A @username cannot be messaged by a bot
 * and is not a stable id, so it is NOT stored. We create an anonymous User and return a deep link
 * t.me/<bot>?start=<signed userId>; when the user presses Start, the dispatcher (getUpdates) writes the
 * chat id into `telegram_id`. Until then alerts are pending.
 */
import { db } from "../db";
import { getEdition } from "../editions";
import type { AlertKindName } from "./kinds";
import { signUserRef, verifyUserRef } from "./token";
import { maskEmail, mergeKinds, type SubscribeInput } from "./validate";

export type SubscribeResult = {
  status: "pending_email_confirmation" | "pending_telegram_start" | "subscribed";
  message: string;
  telegramLink: string | null;
  ref?: string;
  alerts: number;
};

export class SubscribeError extends Error {}

export function telegramDeepLink(token: string): string | null {
  const bot = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  return bot && /^[A-Za-z0-9_]{5,32}$/.test(bot) ? `https://t.me/${bot}?start=${token}` : null;
}

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const edition = getEdition(input.edition);
  if (!edition) throw new SubscribeError("Invalid edition.");

  // Only real titles that exist in this edition.
  const ids = input.alerts.map((a) => a.titleId);
  const known = ids.length
    ? new Set((await db.title.findMany({ where: { id: { in: ids }, localizations: { some: { lang: edition.contentLang } } }, select: { id: true } })).map((t) => t.id))
    : new Set<number>();
  const alerts = input.alerts.filter((a) => known.has(a.titleId));

  if (input.contact.channel === "email") {
    const email = input.contact.email;
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    const user = existing ?? (await db.user.create({ data: { email, countryCode: edition.country, uiLang: "en" }, select: { id: true } }));
    // Unverified address: merge only (never remove or re-route what someone else may have set up).
    const n = await upsertAlerts(user.id, alerts, "email");
    if (!existing) {
      console.info(`[alerts] double opt-in pending for ${maskEmail(email)} (user ${user.id}) — no email provider configured, confirmation not sent`);
    }
    return {
      status: "pending_email_confirmation",
      // Same answer for new and known addresses (no account enumeration).
      message: "Almost done — confirm your email to get the Friday digest.",
      telegramLink: null,
      alerts: n,
    };
  }

  // Telegram — reuse this browser's earlier anonymous user when the signed ref checks out.
  const refUserId = verifyUserRef(input.ref);
  const refUser = refUserId ? await db.user.findUnique({ where: { id: refUserId }, select: { id: true, telegramId: true, email: true } }) : null;
  const user = refUser && !refUser.email ? refUser : await db.user.create({ data: { countryCode: edition.country, uiLang: "en" }, select: { id: true, telegramId: true } });
  const n = await upsertAlerts(user.id, alerts, "telegram");
  const token = signUserRef(user.id);
  const link = telegramDeepLink(token);
  if (!link) console.info(`[alerts] TELEGRAM_BOT_USERNAME not set — telegram subscription for user ${user.id} stays pending`);
  const linked = user.telegramId !== null;
  return {
    status: linked ? "subscribed" : "pending_telegram_start",
    message: linked
      ? "Saved — we'll message you on Telegram."
      : link
        ? "One more step: open Telegram and press Start so our bot can message you."
        : "Saved. Telegram alerts are almost ready — the bot link appears here once it's live.",
    telegramLink: linked ? null : link,
    ref: token,
    alerts: n,
  };
}

async function upsertAlerts(userId: string, alerts: { titleId: number; kinds: AlertKindName[] }[], channel: "email" | "telegram"): Promise<number> {
  if (alerts.length === 0) return 0;
  const existing = await db.alert.findMany({ where: { userId, titleId: { in: alerts.map((a) => a.titleId) } } });
  const byTitle = new Map(existing.map((a) => [a.titleId, a]));
  await db.$transaction(
    alerts.map((a) => {
      const prev = byTitle.get(a.titleId);
      return prev
        ? db.alert.update({ where: { id: prev.id }, data: { kinds: mergeKinds(prev.kinds, a.kinds), channel } })
        : db.alert.create({ data: { userId, titleId: a.titleId, kinds: a.kinds, channel } });
    }),
  );
  return alerts.length;
}
