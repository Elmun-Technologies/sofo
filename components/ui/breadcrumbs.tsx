import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; href?: string };

/** Visible breadcrumbs + BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const base = siteUrl();
  return (
    <>
      <nav aria-label="Breadcrumb" className="wrap pt-4 text-[13px] font-semibold text-text-3 md:pt-5">
        <ol className="no-scrollbar flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 ? (
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              ) : null}
              {c.href && i < items.length - 1 ? (
                <Link href={c.href} className="text-text-3 hover:text-text">
                  {c.name}
                </Link>
              ) : (
                <span className="text-text-2" aria-current={i === items.length - 1 ? "page" : undefined}>
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            ...(c.href ? { item: new URL(c.href, base).toString() } : {}),
          })),
        }}
      />
    </>
  );
}
