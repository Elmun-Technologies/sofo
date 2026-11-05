/** Alert schedule clock. All rules are in local time Europe/Istanbul (CLAUDE.md "Eslatmalar"). */
export const ALERT_TZ = "Europe/Istanbul";
/** Weekly email digest: Friday 18:00 local. */
export const DIGEST_WEEKDAY = 5;
export const DIGEST_HOUR = 18;
/** Max Telegram messages per user per local day; the rest wait for the digest. */
export const TELEGRAM_DAILY_CAP = 3;

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ALERT_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function istanbulParts(d: Date): { dayKey: string; weekday: number; hour: number } {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { dayKey: `${p.year}-${p.month}-${p.day}`, weekday: WEEKDAYS[p.weekday ?? ""] ?? -1, hour: Number(p.hour) % 24 };
}

export function sameLocalDay(a: Date, b: Date): boolean {
  return istanbulParts(a).dayKey === istanbulParts(b).dayKey;
}

/** True during the Friday 18:00–18:59 local hour (the dispatcher runs hourly). */
export function isDigestWindow(now: Date): boolean {
  const p = istanbulParts(now);
  return p.weekday === DIGEST_WEEKDAY && p.hour === DIGEST_HOUR;
}
