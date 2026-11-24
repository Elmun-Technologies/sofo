import Link from "next/link";
import type { CatalogFilters, SortKey } from "@/lib/queries/catalog-pages";
import { catalogHref, SORT_LABELS } from "./catalog-url";
import { Dropdown } from "./dropdown";
import { menuItemClass, MenuMark } from "./menu";

/** "Sort: Popular" pill menu; closes after a pick. */
export function SortMenu({ base, filters, className = "" }: { base: string; filters: CatalogFilters; className?: string }) {
  return (
    <Dropdown
      name="Sort"
      align="right"
      className={className}
      panelClassName="w-48"
      label={
        <>
          <span className="text-text-3">Sort</span> <span className="text-text">{SORT_LABELS[filters.sort]}</span>
        </>
      }
    >
      <ul>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((s) => {
          const on = filters.sort === s;
          return (
            <li key={s}>
              <Link href={catalogHref(base, { ...filters, sort: s, page: 1 })} scroll={false} aria-current={on ? "true" : undefined} className={menuItemClass(on)}>
                {SORT_LABELS[s]}
                <MenuMark active={on} />
              </Link>
            </li>
          );
        })}
      </ul>
    </Dropdown>
  );
}
