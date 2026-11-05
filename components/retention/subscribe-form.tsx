"use client";

import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { track } from "@/lib/client/analytics";
import { useLocalStore } from "@/lib/client/local-store";
import { useWatchlist } from "@/lib/client/watchlist";
import { DEFAULT_ALERT_KINDS, isAlertKind, type AlertKindName } from "@/lib/alerts/kinds";
import { parseContact } from "@/lib/alerts/validate";
import { buttonClass } from "../ui/button";

type Variant = "inline" | "compact" | "card";

export type SubscribeFormProps = {
  /** Follow one title; without it the form subscribes the alerts of every title in My list (or the weekly digest only). */
  titleId?: number;
  kinds?: string[];
  /** Explicit list of {titleId, kinds} (My list → Alerts). Takes precedence over titleId. */
  alerts?: { titleId: number; kinds: string[] }[];
  variant?: Variant;
  /** Edition code; defaults to the first path segment */
  edition?: string;
  submitLabel?: string;
  onSubscribed?: () => void;
};

type Result =
  | { ok: true; status: "pending_email_confirmation" | "pending_telegram_start" | "subscribed"; message: string; telegramLink?: string | null; ref?: string }
  | { ok: false; error: string };

const REF_KEY = "sofo:alerts-ref:v1";

/** "Never miss a dub" — email or @telegram. Telegram is the main channel; email gets the Friday digest. */
export function SubscribeForm({ titleId, kinds, alerts, variant = "inline", edition, submitLabel = "Notify me", onSubscribed }: SubscribeFormProps) {
  const id = useId();
  const pathname = usePathname();
  const list = useWatchlist();
  const [ref, setRef] = useLocalStore<string | null>(REF_KEY, null);
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const editionCode = edition ?? (pathname.split("/")[1] || "tr");

  function buildAlerts(): { titleId: number; kinds: AlertKindName[] }[] {
    const clean = (k: readonly string[] | undefined) => {
      const v = (k ?? []).filter(isAlertKind);
      return v.length ? v : DEFAULT_ALERT_KINDS;
    };
    if (alerts) return alerts.map((a) => ({ titleId: a.titleId, kinds: clean(a.kinds) })).filter((a) => a.kinds.length);
    if (titleId) return [{ titleId, kinds: clean(kinds) }];
    // Home: everything the user saved with alerts on.
    return list.items.filter((i) => (i.alerts?.length ?? 0) > 0).map((i) => ({ titleId: i.id, kinds: clean(i.alerts) }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!parseContact(contact)) {
      setHint("Enter an email address or a Telegram @username.");
      return;
    }
    setHint(null);
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contact, edition: editionCode, alerts: buildAlerts(), ref, website: form.get("website") ?? "" }),
      });
      const data = (await res.json().catch(() => ({ ok: false, error: "Something went wrong. Try again in a minute." }))) as Result;
      setResult(data);
      if (data.ok) {
        if (data.ref) setRef(data.ref);
        if (titleId) list.update(titleId, { alerts: buildAlerts()[0]?.kinds ?? [] });
        track("alert_subscribe", { channel: parseContact(contact)?.channel, title_id: titleId ?? null, edition: editionCode });
        onSubscribed?.();
      }
    } catch {
      setResult({ ok: false, error: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <div role="status" className={`rounded-card border border-available/30 bg-available/10 p-4 text-sm ${variant === "compact" ? "" : "md:p-5"}`}>
        <p className="font-bold text-text">{result.message}</p>
        {result.telegramLink ? (
          <a href={result.telegramLink} target="_blank" rel="noopener" className={`${buttonClass("primary", "sm")} mt-3`}>
            Open Telegram to confirm
          </a>
        ) : null}
        <button type="button" className="mt-3 block text-xs font-bold text-text-2 underline" onClick={() => setResult(null)}>
          Use another address
        </button>
      </div>
    );
  }

  const error = hint ?? (result && !result.ok ? result.error : null);
  const stacked = variant === "card";

  return (
    <form onSubmit={onSubmit} noValidate className={variant === "card" ? "rounded-panel border border-line bg-surface p-5" : ""}>
      {variant === "card" ? (
        <>
          <p className="text-lg font-extrabold">Get alerts on Telegram</p>
          <p className="mt-1 text-sm text-text-2">New Turkish dubs and titles leaving your services. Email gets a Friday digest.</p>
        </>
      ) : null}
      <div className={`flex gap-2 ${stacked ? "mt-4 flex-col" : "flex-col sm:flex-row"}`}>
        <label htmlFor={`${id}-c`} className="sr-only">
          Email or Telegram username
        </label>
        <input
          id={`${id}-c`}
          name="contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@email.com or @telegram"
          aria-invalid={!!error}
          aria-describedby={`${id}-help`}
          className={`min-w-0 flex-1 rounded-input border border-line bg-ink px-4 text-sm font-medium outline-none placeholder:text-text-3 focus:border-orange ${variant === "compact" ? "h-10" : "h-12"}`}
        />
        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <button type="submit" disabled={busy} className={`${buttonClass("primary", variant === "compact" ? "sm" : "md")} ${variant === "compact" ? "h-10" : "h-12"} px-5`}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
      <p id={`${id}-help`} className={`mt-2 text-xs ${error ? "text-leaving" : "text-text-3"}`} aria-live="polite">
        {error ?? "Telegram: instant, max 3 a day. Email: Friday digest. No password, unsubscribe anytime (KVKK)."}
      </p>
    </form>
  );
}
