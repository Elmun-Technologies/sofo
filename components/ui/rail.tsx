"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

/**
 * Horizontal scroller with paging arrows (pointer devices, md+) and soft edge fades.
 * Touch scrolling and scroll-snap work without JS; the arrows are progressive enhancement.
 */
export function Rail({ children, className = "", label }: { children: React.ReactNode; className?: string; label?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow =
    "absolute top-[40%] z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-3/95 text-text ring-1 ring-text/15 backdrop-blur transition duration-200 ease-out hover:scale-105 hover:bg-text hover:text-ink [@media(hover:hover)]:md:inline-flex";

  return (
    <div className="group/rail relative">
      <ul
        ref={ref}
        aria-label={label}
        className={`no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 md:-mx-7 md:scroll-px-7 md:px-7 ${className}`}
      >
        {children}
      </ul>
      <button
        type="button"
        aria-label="Scroll back"
        tabIndex={-1}
        onClick={() => page(-1)}
        className={`${arrow} -left-3 xl:-left-5 ${edge.start ? "pointer-events-none opacity-0" : "opacity-0 group-hover/rail:opacity-100"}`}
      >
        <ChevronLeftIcon className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll forward"
        tabIndex={-1}
        onClick={() => page(1)}
        className={`${arrow} -right-3 xl:-right-5 ${edge.end ? "pointer-events-none opacity-0" : "opacity-0 group-hover/rail:opacity-100"}`}
      >
        <ChevronRightIcon className="size-5" />
      </button>
    </div>
  );
}
