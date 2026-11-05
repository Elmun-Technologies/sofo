/** Alert kinds (mirror of the Prisma `AlertKind` enum). Client-safe — no DB imports. */
export const ALERT_KINDS = ["dub_available", "new_episode", "leaving", "price_drop", "on_my_services", "release"] as const;
export type AlertKindName = (typeof ALERT_KINDS)[number];

/** Kinds a user can toggle per title (Notify me sheet, My list → Alerts). */
export const TITLE_ALERT_KINDS = ["dub_available", "new_episode", "leaving", "price_drop"] as const satisfies readonly AlertKindName[];

/** Default selection when someone taps "Notify me" without choosing. */
export const DEFAULT_ALERT_KINDS: AlertKindName[] = ["dub_available", "leaving"];

export function isAlertKind(x: unknown): x is AlertKindName {
  return typeof x === "string" && (ALERT_KINDS as readonly string[]).includes(x);
}

/** Checkbox label, e.g. "When the Turkish dub arrives", "If it leaves Netflix". */
export function alertKindLabel(kind: AlertKindName, opts: { langName?: string; serviceName?: string; type?: "movie" | "tv" } = {}): string {
  const lang = opts.langName ?? "Turkish";
  switch (kind) {
    case "dub_available":
      return `When the ${lang} dub arrives`;
    case "new_episode":
      return opts.type === "movie" ? "When a new part is out" : "When a new episode is out";
    case "leaving":
      return opts.serviceName ? `If it leaves ${opts.serviceName}` : "If it leaves a service";
    case "price_drop":
      return "If it gets cheaper or free";
    case "on_my_services":
      return "When it lands on my services";
    case "release":
      return "When it's out in my country";
  }
}

/** Short pill used in notification lists. */
export function alertKindBadge(kind: AlertKindName): string {
  return { dub_available: "NEW DUB", new_episode: "NEW EPISODE", leaving: "LEAVING", price_drop: "PRICE", on_my_services: "ON YOUR SERVICES", release: "NOW STREAMING" }[kind];
}
