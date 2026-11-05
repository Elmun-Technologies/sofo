"use client";

import { useId, useState } from "react";
import { DEFAULT_ALERT_KINDS, isAlertKind, type AlertKindName } from "@/lib/alerts/kinds";
import { track } from "@/lib/client/analytics";
import { useWatchlist, type SavedTitle } from "@/lib/client/watchlist";
import { BellIcon } from "../icons";
import { buttonClass } from "../ui/button";
import { PosterImage } from "../ui/poster-image";
import { AlertToggles } from "./alert-toggles";
import { CloseButton, Dialog } from "./dialog";
import { SubscribeForm } from "./subscribe-form";

type Props = {
  title: Omit<SavedTitle, "addedAt">;
  /** e.g. "Season 3 · Netflix · TR subtitles" */
  subtitle?: string;
  serviceName?: string;
  variant?: "secondary" | "ghost" | "icon";
  label?: string;
};

/**
 * "Notify me" button + sheet (boards Modals / MNotify). Saves the title to My list with the chosen
 * alert kinds (localStorage), then optionally subscribes them via Telegram / email.
 */
export function NotifyMeButton({ title, subtitle, serviceName, variant = "secondary", label = "Notify me" }: Props) {
  const list = useWatchlist();
  const saved = list.get(title.id);
  const active = (saved?.alerts?.length ?? 0) > 0;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={variant === "icon" ? `${label}: ${title.name}` : undefined}
        className={variant === "icon" ? "inline-flex size-9 items-center justify-center rounded-chip bg-surface-2 text-text hover:bg-line" : buttonClass(variant)}
      >
        <BellIcon className={`size-[18px] ${active ? "text-orange" : ""}`} />
        {variant === "icon" ? null : active ? "Alerts on" : label}
      </button>
      {open ? <NotifySheet title={title} subtitle={subtitle} serviceName={serviceName} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function NotifySheet({ title, subtitle, serviceName, onClose }: Omit<Props, "variant" | "label"> & { onClose: () => void }) {
  const id = useId();
  const list = useWatchlist();
  const saved = list.get(title.id);
  const [kinds, setKinds] = useState<AlertKindName[]>(() => {
    const k = (saved?.alerts ?? []).filter(isAlertKind);
    return k.length ? k : DEFAULT_ALERT_KINDS;
  });
  const [channel, setChannel] = useState<"telegram" | "email" | "device">("telegram");

  const saveLocal = () => {
    if (saved) list.update(title.id, { alerts: kinds });
    else list.add({ ...title, alerts: kinds });
  };

  return (
    <Dialog open onClose={onClose} labelledBy={`${id}-h`}>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-h`} className="text-xl font-extrabold">
            Notify me
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-12 shrink-0">
            <PosterImage path={title.posterPath} alt="" sizes="48px" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-extrabold">{title.name}</p>
            {subtitle ? <p className="truncate text-sm text-text-2">{subtitle}</p> : null}
          </div>
        </div>
        <div className="mt-4">
          <AlertToggles value={kinds} onChange={setKinds} serviceName={serviceName} type={title.type} />
        </div>

        <p className="mt-5 text-sm font-bold">Send to</p>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Channel">
          {(
            [
              ["telegram", "Telegram"],
              ["email", "Email"],
              ["device", "This device only"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={channel === v}
              onClick={() => setChannel(v)}
              className={`inline-flex h-9 items-center rounded-chip px-3.5 text-sm font-bold ${channel === v ? "bg-white text-ink" : "border border-line text-text"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {kinds.length === 0 ? (
            <p className="text-sm text-text-2">Pick at least one alert.</p>
          ) : channel === "device" ? (
            <button
              type="button"
              className={`${buttonClass("primary")} h-12 w-full text-[15px]`}
              onClick={() => {
                saveLocal();
                track("alert_subscribe", { channel: "device", title_id: title.id });
                onClose();
              }}
            >
              Save alerts
            </button>
          ) : (
            <>
              <SubscribeForm
                key={channel}
                alerts={[{ titleId: title.id, kinds }]}
                variant="compact"
                submitLabel="Save alerts"
                onSubscribed={saveLocal}
              />
              <p className="mt-1 text-xs text-text-3">
                {channel === "telegram" ? "Type your @username — you'll confirm once in Telegram." : "Email alerts arrive in the Friday 18:00 digest."}
              </p>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
