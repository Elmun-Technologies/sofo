import Link from "next/link";

/** Prev · 1 2 3 … N · Next. `href(page)` builds each URL. */
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-chip border border-line px-3.5 text-sm font-bold";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={btn}>
          ← Prev
        </Link>
      ) : null}
      {list.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - list[i - 1]! > 1 ? <span className={`${btn} border-transparent text-text-3`}>…</span> : null}
          {p === page ? (
            <span aria-current="page" className={`${btn} border-white bg-white text-ink`}>
              {p}
            </span>
          ) : (
            <Link href={href(p)} className={btn}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className={btn}>
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
