"use client";

import { useEffect, useState } from "react";

export type TitleTab = { id: string; label: string; count?: number };

/**
 * santehnika product-page tabs: a sticky row of anchors under the hero. All sections stay rendered
 * (SEO, no hidden content); the active tab follows the scroll position.
 */
export function TitleTabs({ tabs }: { tabs: TitleTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((en) => en.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-190px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  return (
    <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-hairline bg-ink/95 backdrop-blur-xl md:top-[120px]">
      <ul className="wrap no-scrollbar flex gap-6 overflow-x-auto md:gap-8">
        {tabs.map((t) => (
          <li key={t.id} className="shrink-0">
            <a
              href={`#${t.id}`}
              onClick={() => setActive(t.id)}
              aria-current={active === t.id ? "true" : undefined}
              className={`relative flex h-12 items-center gap-1.5 text-[14px] font-bold whitespace-nowrap transition-colors md:text-[15px] ${
                active === t.id ? "text-text after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange" : "text-text-2 hover:text-text"
              }`}
            >
              {t.label}
              {t.count ? <span className="tnum rounded-md bg-surface px-1.5 text-xs font-semibold text-text-2">{t.count}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
