import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; href?: string };

/** Visible breadcrumbs + BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const base = siteUrl();
  return (
    <>
      <nav aria-label="Breadcrumb" className="mx-auto max-w-site px-4 pt-4 text-[13px] text-text-2 md:px-7 md:pt-6">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {c.href && i < items.length - 1 ? (
                <Link href={c.href} className="text-text-2">
                  {c.name}
                </Link>
              ) : (
                <span className="text-text" aria-current={i === items.length - 1 ? "page" : undefined}>
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
