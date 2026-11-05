"use client";

import { alertKindLabel, TITLE_ALERT_KINDS, type AlertKindName } from "@/lib/alerts/kinds";

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
    <ul className={`grid ${dense ? "gap-1.5" : "gap-2"}`}>
      {list.map((k) => {
        const on = value.includes(k);
        return (
          <li key={k}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-button border px-3.5 text-sm font-bold transition ${dense ? "py-2.5" : "py-3"} ${
                on ? "border-orange/40 bg-orange-deep" : "border-transparent bg-ink/50 hover:border-line"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onChange(on ? (value.filter((x) => x !== k) as AlertKindName[]) : ([...value, k] as AlertKindName[]))}
                className="size-[18px] shrink-0 accent-orange"
              />
              {alertKindLabel(k, { serviceName, type, langName })}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
