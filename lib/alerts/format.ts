/** Alert copy (Telegram + email digest) — pure, deterministic, from event data only (no AI text). */
import { formatDate, formatPrice } from "../format";
import { langName } from "../lang";
import type { AlertKindName } from "./kinds";
import { jsonNumber, jsonString, type AlertEvent } from "./match";
import type { DigestPlan, Match, TelegramPlan } from "./plan";

export type CopyCtx = {
  /** Absolute site origin, e.g. https://sofo.tv */
  siteUrl: string;
  /** Edition content language, e.g. "tr" */
  lang: string;
  /** Edition country name, e.g. "Türkiye" */
  countryName: string;
  /** Edition currency for price events without one */
  currency: string | null;
  /** /tr/listem */
  myListPath: string;
};

export function withUtm(url: string, source: "telegram" | "email", campaign: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", source === "email" ? "digest" : "alert");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function price(ev: AlertEvent, key: "before" | "after", currency: string | null): string | null {
  const v = ev[key];
  return formatPrice(jsonNumber(v, "price"), jsonString(v, "currency") ?? currency);
}

/** One plain-text line for an event, e.g. "Arcane is now in Turkish on Netflix". */
export function eventHeadline(kind: AlertKindName | null, ev: AlertEvent, ctx: Pick<CopyCtx, "lang" | "currency">): string {
  const t = ev.titleName;
  const s = ev.serviceName;
  switch (kind) {
    case "dub_available":
      return `${t} is now in ${langName(ctx.lang)} on ${s}`;
    case "leaving": {
      const at = jsonString(ev.after, "leavingAt");
      return at ? `${t} leaves ${s} on ${formatDate(at, { day: "numeric", month: "short" })}` : `${t} is leaving ${s} soon`;
    }
    case "price_drop": {
      if (ev.offerType === "free") return `${t} is now free on ${s}`;
      if (ev.offerType === "ads") return `${t} is now free with ads on ${s}`;
      const b = price(ev, "before", ctx.currency);
      const a = price(ev, "after", ctx.currency);
      return b && a ? `${t} is cheaper on ${s}: ${b} → ${a}` : `${t} got cheaper on ${s}`;
    }
    case "new_episode":
      return `New episode of ${t} on ${s}`;
    case "release":
    case "on_my_services":
      return `${t} is now on ${s}`;
    default:
      return `${t}: availability changed on ${s}`;
  }
}

const EMOJI: Record<AlertKindName, string> = {
  dub_available: "🔊",
  leaving: "⏳",
  price_drop: "🏷️",
  new_episode: "📺",
  release: "🎬",
  on_my_services: "🎬",
};

function abs(ctx: CopyCtx, path: string) {
  return new URL(path, ctx.siteUrl).toString();
}

export type TelegramMessage = { chatId: string; text: string; buttons: { text: string; url: string }[] };

/** One message per title (Telegram HTML parse mode). Every message carries a "Manage / mute" link. */
export function telegramMessage(plan: TelegramPlan, ctx: CopyCtx): TelegramMessage {
  const first = plan.matches[0]!;
  const lines = plan.matches.map((m) => `${EMOJI[m.kind]} ${esc(eventHeadline(m.kind, m.event, ctx))}`);
  const titlePath = first.event.titlePath;
  const buttons: TelegramMessage["buttons"] = [];
  if (titlePath) buttons.push({ text: "Where to watch ↗", url: withUtm(abs(ctx, titlePath), "telegram", first.kind) });
  buttons.push({ text: "Mute / manage", url: withUtm(abs(ctx, `${ctx.myListPath}#alerts`), "telegram", "manage") });
  return { chatId: plan.chatId, text: `<b>${esc(first.event.titleName)}</b>\n${lines.join("\n")}`, buttons };
}

function counts(plan: DigestPlan) {
  const s = plan.sections;
  return { dubs: s.dubs.length + plan.newDubs.length, leaving: s.leaving.length, other: s.prices.length + s.episodes.length + s.releases.length };
}

export function digestSubject(plan: DigestPlan, ctx: CopyCtx): string {
  const c = counts(plan);
  const parts: string[] = [];
  if (c.dubs) parts.push(`${c.dubs} new ${langName(ctx.lang)} dub${c.dubs === 1 ? "" : "s"}`);
  if (c.leaving) parts.push(`${c.leaving} leaving soon`);
  if (c.other) parts.push(`${c.other} more update${c.other === 1 ? "" : "s"}`);
  return parts.join(", ") || "Your week on sofo";
}

type Row = { title: string; meta: string; url: string | null };

function digestRows(plan: DigestPlan, ctx: CopyCtx): { heading: string; rows: Row[] }[] {
  const s = plan.sections;
  const row = (m: Match): Row => ({
    title: m.event.titleName,
    meta: eventHeadline(m.kind, m.event, ctx).replace(`${m.event.titleName} `, "").replace(/^is /, ""),
    url: m.event.titlePath ? withUtm(abs(ctx, m.event.titlePath), "email", m.kind) : null,
  });
  const dubRows = [
    ...s.dubs.map(row),
    ...plan.newDubs.map((ev) => ({ title: ev.titleName, meta: `${ev.serviceName} · ${langName(ctx.lang)} audio`, url: ev.titlePath ? withUtm(abs(ctx, ev.titlePath), "email", "new_dubs") : null })),
  ];
  return [
    { heading: `New in ${langName(ctx.lang)}`, rows: dubRows },
    { heading: "Leaving your services", rows: s.leaving.map(row) },
    { heading: "Cheaper now", rows: s.prices.map(row) },
    { heading: "New episodes", rows: s.episodes.map(row) },
    { heading: "Now streaming", rows: s.releases.map(row) },
  ].filter((g) => g.rows.length > 0);
}

/** Weekly email digest (subject, plain text, minimal inline-styled HTML). */
export function digestEmail(plan: DigestPlan, ctx: CopyCtx, now: Date): { subject: string; text: string; html: string } {
  const subject = digestSubject(plan, ctx);
  const date = formatDate(now, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  const groups = digestRows(plan, ctx);
  const listUrl = withUtm(abs(ctx, ctx.myListPath), "email", "digest");
  const manageUrl = withUtm(abs(ctx, `${ctx.myListPath}#alerts`), "email", "manage");
  const footer = `You get this because you follow titles or ${langName(ctx.lang)} dubs on sofo. Change alerts or unsubscribe: ${manageUrl}. sofo never hosts video. KVKK: we store only your email and alert settings.`;

  const text = [
    `${date} · ${ctx.countryName}`,
    subject,
    "",
    ...groups.flatMap((g) => [g.heading, ...g.rows.map((r) => `- ${r.title} — ${r.meta}${r.url ? ` ${r.url}` : ""}`), ""]),
    `See everything: ${listUrl}`,
    "",
    footer,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Manrope,Arial,sans-serif;color:#0a0a0d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0a0a0d;padding:20px 28px;color:#fff;font-weight:900;font-size:22px"><span style="background:#ff5a1f;border-radius:6px;padding:0 7px;margin-right:6px">s</span>sofo</td></tr>
<tr><td style="padding:28px">
<p style="margin:0;color:#ff5a1f;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">${esc(date)} · ${esc(ctx.countryName)}</p>
<h1 style="margin:10px 0 20px;font-size:26px">${esc(subject)}</h1>
${groups
  .map(
    (g) =>
      `<h2 style="font-size:16px;margin:20px 0 8px">${esc(g.heading)}</h2>${g.rows
        .map(
          (r) =>
            `<p style="margin:0 0 12px"><b>${r.url ? `<a href="${esc(r.url)}" style="color:#0a0a0d">${esc(r.title)}</a>` : esc(r.title)}</b><br><span style="color:#6e6e7a;font-size:14px">${esc(r.meta)}</span></p>`,
        )
        .join("")}`,
  )
  .join("\n")}
<p style="margin:24px 0 0"><a href="${esc(listUrl)}" style="display:inline-block;background:#ff5a1f;color:#0a0a0d;font-weight:800;padding:12px 20px;border-radius:12px;text-decoration:none">See everything on sofo</a></p>
</td></tr>
<tr><td style="background:#f4f4f5;padding:16px 28px;font-size:12px;color:#6e6e7a">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, text, html };
}

/** Telegram "Your Friday list". */
export function telegramDigest(plan: DigestPlan, ctx: CopyCtx): TelegramMessage {
  const groups = digestRows(plan, ctx);
  const lines = groups.flatMap((g) => [`\n<b>${esc(g.heading)}</b>`, ...g.rows.map((r) => `• ${esc(r.title)} — ${esc(r.meta)}`)]);
  return {
    chatId: plan.to,
    text: `📅 <b>Your Friday list</b>${lines.join("\n")}`,
    buttons: [
      { text: "Open list ↗", url: withUtm(abs(ctx, ctx.myListPath), "telegram", "digest") },
      { text: "Mute / manage", url: withUtm(abs(ctx, `${ctx.myListPath}#alerts`), "telegram", "manage") },
    ],
  };
}
