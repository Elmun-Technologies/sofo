/**
 * Alert dispatcher — run hourly (GitHub Actions cron):
 *   pnpm exec dotenv -e .env.local -- tsx scripts/alerts/dispatch.ts [--dry-run] [--digest] [--now=2026-11-06T15:00:00Z]
 *
 * 1. Telegram linking: reads bot updates (getUpdates) — "/start <token>" stores the chat id on the user,
 *    "/stop" removes Telegram alerts (mute / unsubscribe).
 * 2. Instant Telegram alerts: events since alert.lastSentAt, one message per title, max 3 per user per day.
 * 3. Friday 18:00 Europe/Istanbul (or --digest): weekly digest — email (provider not configured → dry-run log)
 *    and Telegram "Your Friday list" with whatever the daily cap held back.
 *
 * Sends only when TELEGRAM_BOT_TOKEN is set and --dry-run is not given; otherwise logs what it would send.
 * lastSentAt is updated only for messages that were actually delivered.
 */
import type { Prisma } from "@prisma/client";
import { digestEmail, telegramDigest, telegramMessage, type CopyCtx, type TelegramMessage } from "../../lib/alerts/format";
import type { AlertEvent } from "../../lib/alerts/match";
import { planDigest, planTelegram, type PlanAlert, type PlanUser } from "../../lib/alerts/plan";
import { isDigestWindow } from "../../lib/alerts/time";
import { verifyUserRef } from "../../lib/alerts/token";
import { mergeKinds } from "../../lib/alerts/validate";
import { db } from "../../lib/db";
import { EDITIONS, paths, type Edition } from "../../lib/editions";
import { fetchJson, HttpError } from "../../lib/sources/http";

const args = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--now=")));
const nowArg = process.argv.find((a) => a.startsWith("--now="))?.slice(6);
const now = nowArg ? new Date(nowArg) : new Date();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
const LIVE = !!TOKEN && !args.has("--dry-run");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const LOOKBACK_MS = 8 * 86_400_000;

const log = (...a: unknown[]) => console.log("[alerts]", ...a);

function editionFor(country: string): Edition | undefined {
  return Object.values(EDITIONS).find((e) => e.country === country);
}

function ctxFor(e: Edition): CopyCtx {
  return { siteUrl: SITE, lang: e.contentLang, countryName: e.countryName, currency: e.country === "TR" ? "TRY" : null, myListPath: e.routes.myList };
}

// ───────────── Telegram API (token never logged) ─────────────

type TgResponse<T> = { ok: boolean; result: T; description?: string };

async function tg<T>(method: string, params: Record<string, string | number | undefined>): Promise<T> {
  if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string | number] => e[1] !== undefined).map(([k, v]) => [k, String(v)]));
  try {
    const r = await fetchJson<TgResponse<T>>(`https://api.telegram.org/bot${TOKEN}/${method}?${qs}`, { minIntervalMs: 50, retries: 2 });
    if (!r.ok) throw new Error(`Telegram ${method}: ${r.description ?? "not ok"}`);
    return r.result;
  } catch (err) {
    const msg = err instanceof HttpError ? `HTTP ${err.status}` : err instanceof Error ? err.message : String(err);
    throw new Error(`Telegram ${method} failed: ${msg.replaceAll(TOKEN, "***")}`);
  }
}

async function send(m: TelegramMessage): Promise<boolean> {
  if (!LIVE) {
    log(`DRY telegram → chat ${m.chatId}:\n${m.text}\n  buttons: ${m.buttons.map((b) => `${b.text} <${b.url}>`).join(" | ")}`);
    return false;
  }
  try {
    await tg("sendMessage", {
      chat_id: m.chatId,
      text: m.text,
      parse_mode: "HTML",
      disable_web_page_preview: "true",
      reply_markup: JSON.stringify({ inline_keyboard: [m.buttons.map((b) => ({ text: b.text, url: b.url }))] }),
    });
    return true;
  } catch (err) {
    log("send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

type TgUpdate = { update_id: number; message?: { text?: string; chat: { id: number; type: string } } };

/** "/start <signed userId>" links the chat; "/stop" mutes. */
async function processUpdates() {
  if (!LIVE) return;
  let updates: TgUpdate[];
  try {
    updates = await tg<TgUpdate[]>("getUpdates", { timeout: 0, allowed_updates: JSON.stringify(["message"]) });
  } catch (err) {
    log("getUpdates skipped:", err instanceof Error ? err.message : err);
    return;
  }
  for (const u of updates) {
    const msg = u.message;
    if (!msg?.text || msg.chat.type !== "private") continue;
    const chatId = BigInt(msg.chat.id);
    const [cmd, payload] = msg.text.trim().split(/\s+/, 2);
    if (cmd === "/start") {
      const userId = verifyUserRef(payload);
      if (!userId) {
        await send({ chatId: String(chatId), text: "Hi! Open sofo and tap “Notify me” on a title to connect alerts.", buttons: [{ text: "Open sofo", url: SITE }] });
        continue;
      }
      await linkChat(userId, chatId);
      await send({
        chatId: String(chatId),
        text: "You're in ✓ We'll message you when a title you follow gets a dub, leaves a service or gets cheaper — max 3 messages a day. Send /stop to unsubscribe.",
        buttons: [],
      });
    } else if (cmd === "/stop") {
      const user = await db.user.findUnique({ where: { telegramId: chatId }, select: { id: true } });
      if (user) {
        await db.$transaction([db.alert.deleteMany({ where: { userId: user.id, channel: "telegram" } }), db.user.update({ where: { id: user.id }, data: { telegramId: null } })]);
      }
      await send({ chatId: String(chatId), text: "Unsubscribed. We won't message you again. You can reconnect from My list anytime.", buttons: [] });
    }
  }
  const last = updates.at(-1);
  if (last) await tg("getUpdates", { offset: last.update_id + 1, limit: 1, timeout: 0 }).catch(() => undefined); // acknowledge
}

async function linkChat(userId: string, chatId: bigint) {
  const [user, owner] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, include: { alerts: true } }),
    db.user.findUnique({ where: { telegramId: chatId }, include: { alerts: true } }),
  ]);
  if (!user) return;
  if (!owner || owner.id === user.id) {
    await db.user.update({ where: { id: user.id }, data: { telegramId: chatId } });
    log(`linked telegram chat for user ${user.id}`);
    return;
  }
  // This chat already belongs to another user: move the new alerts there, drop the anonymous user.
  const ops: Prisma.PrismaPromise<unknown>[] = user.alerts.map((a) => {
    const prev = owner.alerts.find((x) => x.titleId === a.titleId);
    return prev
      ? db.alert.update({ where: { id: prev.id }, data: { kinds: mergeKinds(prev.kinds, a.kinds), channel: "telegram" } })
      : db.alert.create({ data: { userId: owner.id, titleId: a.titleId, kinds: a.kinds, channel: "telegram" } });
  });
  if (!user.email) ops.push(db.user.delete({ where: { id: user.id } }));
  await db.$transaction(ops);
  log(`merged user ${user.id} into ${owner.id}`);
}

// ───────────── Load + plan ─────────────

async function loadEvents(): Promise<AlertEvent[]> {
  const since = new Date(now.getTime() - LOOKBACK_MS);
  const countries = Object.values(EDITIONS).map((e) => e.country);
  const rows = await db.availabilityEvent.findMany({
    where: { occurredAt: { gte: since, lte: now }, countryCode: { in: countries } },
    include: { service: { select: { slug: true, name: true } }, title: { select: { type: true, localizations: { select: { lang: true, name: true, slug: true } } } } },
    orderBy: { occurredAt: "asc" },
  });

  // "added" events reference an offer; season/episode offers mean a new episode, not a new title.
  const offerIds = rows.map((r) => (r.type === "added" ? Number((r.after as { offerId?: unknown } | null)?.offerId) : NaN)).filter(Number.isInteger);
  const parts = new Map(
    (await db.offer.findMany({ where: { id: { in: offerIds } }, select: { id: true, seasonId: true, episodeId: true } })).map((o) => [o.id, o]),
  );

  return rows.map((r) => {
    const e = editionFor(r.countryCode);
    const loc = r.title.localizations.find((l) => l.lang === e?.contentLang) ?? r.title.localizations[0];
    let after = r.after;
    const offerId = Number((r.after as { offerId?: unknown } | null)?.offerId);
    const part = r.type === "added" ? parts.get(offerId) : undefined;
    if (part && (part.seasonId || part.episodeId)) after = { ...(r.after as object), seasonId: part.seasonId, episodeId: part.episodeId };
    return {
      id: r.id.toString(),
      titleId: r.titleId,
      titleName: loc?.name ?? `#${r.titleId}`,
      titlePath: e && loc ? paths.title(e, r.title.type, loc.slug) : null,
      countryCode: r.countryCode,
      serviceSlug: r.service.slug,
      serviceName: r.service.name,
      type: r.type,
      offerType: r.offerType,
      before: r.before,
      after,
      occurredAt: r.occurredAt,
    };
  });
}

async function main() {
  log(`run at ${now.toISOString()} · ${LIVE ? "LIVE" : TOKEN ? "dry-run (--dry-run)" : "dry-run (TELEGRAM_BOT_TOKEN not set)"}`);
  await processUpdates();

  const userRows = await db.user.findMany({
    where: { OR: [{ email: { not: null } }, { telegramId: { not: null } }] },
    select: { id: true, email: true, telegramId: true, countryCode: true },
  });
  const users: PlanUser[] = userRows.map((u) => ({ ...u, telegramId: u.telegramId?.toString() ?? null }));
  const alerts: PlanAlert[] = await db.alert.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    select: { id: true, userId: true, titleId: true, kinds: true, channel: true, lastSentAt: true, createdAt: true },
  });
  const events = await loadEvents();
  const langForCountry = (cc: string) => editionFor(cc)?.contentLang;
  const userCountry = new Map(users.map((u) => [u.id, u.countryCode]));
  log(`${users.length} users · ${alerts.length} alerts · ${events.length} events in the last 8 days`);

  // Instant Telegram alerts
  const { messages, deferred } = planTelegram({ users, alerts, events, now, langForCountry });
  let sent = 0;
  for (const m of messages) {
    const e = editionFor(userCountry.get(m.userId) ?? "");
    if (!e) continue;
    if (await send(telegramMessage(m, ctxFor(e)))) {
      await db.alert.update({ where: { id: m.alertId }, data: { lastSentAt: now } });
      const a = alerts.find((x) => x.id === m.alertId);
      if (a) a.lastSentAt = now;
      sent++;
    }
  }
  log(`telegram: ${messages.length} planned, ${sent} sent, ${deferred.length} deferred (daily cap / already sent today)`);

  // Weekly digest
  if (isDigestWindow(now) || args.has("--digest")) {
    const digests = planDigest({ users, alerts, events, now, langForCountry });
    let delivered = 0;
    for (const d of digests) {
      const e = editionFor(userCountry.get(d.userId) ?? "");
      if (!e) continue;
      let ok = false;
      if (d.channel === "telegram") ok = await send(telegramDigest(d, ctxFor(e)));
      else {
        // No email provider configured yet (and no verified-email column) → never send, only log.
        const mail = digestEmail(d, ctxFor(e), now);
        log(`DRY email digest → user ${d.userId}: "${mail.subject}" (${mail.text.length} chars)`);
      }
      if (ok && d.alertIds.length) {
        await db.alert.updateMany({ where: { id: { in: d.alertIds } }, data: { lastSentAt: now } });
        delivered++;
      }
    }
    log(`digest: ${digests.length} planned, ${delivered} delivered`);
  }
}

main()
  .catch((err) => {
    console.error("[alerts] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
