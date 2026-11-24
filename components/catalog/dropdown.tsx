"use client";

import { useEffect, useRef } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { pillClass } from "./menu";

type Props = {
  /** Pill text: the picked value, or the facet name when nothing is picked. */
  label: React.ReactNode;
  /** Accessible name of the control, e.g. "Service". */
  name: string;
  /** A value is picked → the pill is filled. */
  active?: boolean;
  /** Dropdowns sharing a group close each other (native <details name>). */
  group?: string;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
  children: React.ReactNode;
};

/**
 * Pill that opens a small menu of links. Built on <details> so it opens without JS;
 * the script only adds what a menu needs: close on pick, on outside press and on Escape.
 */
export function Dropdown({ label, name, active, group, align = "left", className = "", panelClassName = "w-60", children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !el.open) return;
      el.open = false;
      el.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} name={group} className={`group/dd relative ${className}`}>
      <summary aria-label={name} className={`${pillClass(active)} w-full list-none justify-between`}>
        <span className="truncate">{label}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-70 transition-transform duration-200 group-open/dd:rotate-180" />
      </summary>
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a") && ref.current) ref.current.open = false;
        }}
        className={`animate-pop-in absolute z-30 mt-2 max-h-[min(420px,60vh)] overflow-y-auto rounded-card border border-hairline-strong bg-surface-2 p-1.5 shadow-pop ${
          align === "right" ? "right-0" : "left-0"
        } ${panelClassName}`}
      >
        {children}
      </div>
    </details>
  );
}
