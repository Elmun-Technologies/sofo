"use client";

import { alertKindLabel, TITLE_ALERT_KINDS, type AlertKindName } from "@/lib/alerts/kinds";
import { CheckIcon } from "../icons";

type Props = {
  value: string[];
  onChange: (next: AlertKindName[]) => void;
  kinds?: readonly AlertKindName[];
  /** Service the title is on now — "If it leaves Netflix" */
  serviceName?: string;
  type?: "movie" | "tv";
  langName?: string;
  dense?: boolean;
};

/** Checkbox rows (board Modals "Notify me"): dub arrives · new episode · leaves · gets cheaper. */
export function AlertToggles({ value, onChange, kinds = TITLE_ALERT_KINDS, serviceName, type, langName, dense }: Props) {
  const list = type === "movie" ? kinds.filter((k) => k !== "new_episode") : kinds;
  return (
    <ul className={`grid ${dense ? "gap-1.5 sm:grid-cols-2" : "gap-2"}`}>
      {list.map((k) => {
        const on = value.includes(k);
        return (
          <li key={k}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-input px-3.5 text-sm font-medium ring-1 transition duration-200 ease-out ring-inset ${dense ? "min-h-11 py-2" : "min-h-12 py-2.5"} ${
                on ? "bg-white/6 text-text ring-white/25" : "text-text-2 ring-hairline hover:text-text hover:ring-hairline-strong"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onChange(on ? (value.filter((x) => x !== k) as AlertKindName[]) : ([...value, k] as AlertKindName[]))}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] transition duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${
                  on ? "bg-white text-ink" : "ring-1 ring-white/25 ring-inset"
                }`}
              >
                {on ? <CheckIcon className="size-3.5 stroke-[3]" /> : null}
              </span>
              {alertKindLabel(k, { serviceName, type, langName })}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
