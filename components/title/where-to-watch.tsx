"use client";

import { useState } from "react";

type Tab = { key: string; label: string; count: number; content: React.ReactNode };

/** Stream / Rent / Buy tabs. Content is server-rendered; this only switches visibility. */
export function WhereToWatchTabs({ heading, tabs, footer }: { heading: string; tabs: Tab[]; footer: React.ReactNode }) {
  const available = tabs.filter((t) => t.count > 0);
  const [active, setActive] = useState(available[0]?.key ?? tabs[0]?.key);
  return (
    <section aria-labelledby="wtw" className="h-fit rounded-panel border border-hairline-strong bg-surface/85 p-4 shadow-pop backdrop-blur-xl md:p-5">
      <h2 id="wtw" className="text-h3">
        {heading}
      </h2>
      <div role="tablist" aria-label="Offer type" className="mt-3 mb-2 grid grid-cols-3 gap-1 rounded-button bg-ink/70 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active === t.key}
            disabled={t.count === 0}
            onClick={() => setActive(t.key)}
            className={`tnum h-9 rounded-[7px] text-[13px] font-bold transition-colors disabled:opacity-35 ${active === t.key ? "bg-surface-3 text-text shadow-card" : "text-text-2 hover:text-text"}`}
          >
            {t.label}
            {t.count > 0 ? <span className="ml-1.5 text-text-3">{t.count}</span> : null}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
      <div className="mt-2 border-t border-hairline pt-3">{footer}</div>
    </section>
  );
}
