const DAY = 86_400_000;

export function formatPrice(price: number | null | undefined, currency: string | null | undefined): string | null {
  if (price == null) return null;
  if (currency === "TRY") return `₺${price % 1 === 0 ? price : price.toFixed(2).replace(/\.?0+$/, "")}`;
  return new Intl.NumberFormat("en", { style: "currency", currency: currency ?? "USD" }).format(price);
}

export function formatRuntime(min: number | null | undefined): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Date(d).toLocaleDateString("en-GB", { timeZone: "Europe/Istanbul", ...opts });
}

export function formatMonth(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "Europe/Istanbul" });
}

/** "Checked today 09:40", "Checked yesterday", "Checked 3 days ago". */
export function checkedLabel(checkedAt: Date | string, now = new Date()): string {
  const d = new Date(checkedAt);
  const fmtTime = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
  const dayKey = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  if (dayKey(d) === dayKey(now)) return `Checked today ${fmtTime}`;
  const days = Math.max(1, Math.round((now.getTime() - d.getTime()) / DAY));
  return days === 1 ? `Checked yesterday ${fmtTime}` : `Checked ${days} days ago`;
}

export function daysUntil(d: Date | string, now = new Date()): number {
  return Math.ceil((new Date(d).getTime() - now.getTime()) / DAY);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
