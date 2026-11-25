"use client";

import { useEffect, useState } from "react";

/**
 * Phones only: shows its children (the main outbound CTA) in a bar above the tab bar
 * once the in-page CTA (`#${targetId}`) has scrolled out of view — never two identical buttons on screen.
 */
export function StickyCta({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e!.isIntersecting && e!.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={!show}
      className={`glass fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 border-t border-hairline px-4 py-2.5 transition duration-300 ease-out md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      {...(show ? {} : { inert: true })}
    >
      {children}
    </div>
  );
}
