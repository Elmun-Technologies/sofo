import { CheckIcon } from "@/components/icons";

/** Class helpers for the pill menus — kept out of the client module so server components can call them. */
export const pillClass = (active?: boolean) =>
  `inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium whitespace-nowrap select-none transition duration-200 ease-out lg:h-10 ${
    active ? "bg-white text-ink hover:text-ink" : "text-text-2 ring-1 ring-inset ring-hairline-strong hover:bg-white/6 hover:text-text hover:ring-white/30"
  }`;

/** One row of a dropdown menu (wrap a Link around it or pass it as the link's className). */
export const menuItemClass = (active?: boolean, dim?: boolean) =>
  `flex min-h-10 w-full items-center gap-2.5 rounded-input px-3 py-2 text-sm transition-colors duration-150 hover:bg-white/8 hover:text-text ${
    active ? "font-semibold text-text" : dim ? "text-text-3" : "text-text-2"
  }`;

/** Trailing slot of a menu row: a check when picked, otherwise the count. */
export function MenuMark({ active, count }: { active?: boolean; count?: number }) {
  if (active) return <CheckIcon className="ml-auto size-4 shrink-0 text-text" />;
  if (count == null) return null;
  return <span className="tnum ml-auto shrink-0 text-xs text-text-3">{count.toLocaleString("en-US")}</span>;
}
