"use client";

import { useState } from "react";

type Tab = { key: string; label: string; count: number; content: React.ReactNode };

/** Stream / Rent / Buy tabs. Content is server-rendered; this only switches visibility. */
export function WhereToWatchTabs({ heading, tabs, footer }: { heading: string; tabs: Tab[]; footer: React.ReactNode }) {
  const available = tabs.filter((t) => t.count > 0);
  const [active, setActive] = useState(available[0]?.key ?? tabs[0]?.key);
  return (
    <section aria-labelledby="wtw" className="rounded-panel border border-line bg-surface/95 p-4 backdrop-blur md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="wtw" className="mr-auto text-[15px] font-extrabold">
          {heading}
        </h2>
        <div role="tablist" className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active === t.key}
              disabled={t.count === 0}
              onClick={() => setActive(t.key)}
              className={`h-8 rounded-chip px-3 text-[13px] font-bold disabled:opacity-35 ${active === t.key ? "bg-white text-ink" : "bg-surface-2 text-text"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
      <div className="mt-3">{footer}</div>
    </section>
  );
}
