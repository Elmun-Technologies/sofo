import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

/** Prev · 1 2 3 … N · Next. `href(page)` builds each URL. */
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const cell = "tnum inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium transition duration-200 ease-out";
  const idle = `${cell} text-text-2 hover:bg-text/8 hover:text-text`;
  const step = `${cell} gap-1.5 text-text ring-1 ring-inset ring-hairline-strong hover:bg-text/6 hover:text-text hover:ring-text/30 sm:px-4`;
  const off = `${cell} gap-1.5 text-text-3 opacity-40 ring-1 ring-inset ring-hairline-strong sm:px-4`;

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-4 md:mt-16">
      <div className="flex items-center gap-1 sm:gap-1.5">
        {page > 1 ? (
          <Link href={href(page - 1)} rel="prev" className={`${step} mr-1 sm:mr-2`}>
            <ChevronLeftIcon className="size-4" />
            <span className="max-sm:sr-only">Prev</span>
          </Link>
        ) : (
          <span aria-hidden="true" className={`${off} mr-1 sm:mr-2`}>
            <ChevronLeftIcon className="size-4" />
            <span className="max-sm:hidden">Prev</span>
          </span>
        )}
        {list.map((p, i) => (
          <span key={p} className="contents">
            {i > 0 && p - list[i - 1]! > 1 ? (
              <span aria-hidden="true" className="inline-flex w-6 justify-center text-text-3">
                …
              </span>
            ) : null}
            {p === page ? (
              <span aria-current="page" className={`${cell} bg-text text-ink`}>
                {p}
              </span>
            ) : (
              <Link href={href(p)} aria-label={`Page ${p}`} className={idle}>
                {p}
              </Link>
            )}
          </span>
        ))}
        {page < pages ? (
          <Link href={href(page + 1)} rel="next" className={`${step} ml-1 sm:ml-2`}>
            <span className="max-sm:sr-only">Next</span>
            <ChevronRightIcon className="size-4" />
          </Link>
        ) : (
          <span aria-hidden="true" className={`${off} ml-1 sm:ml-2`}>
            <span className="max-sm:hidden">Next</span>
            <ChevronRightIcon className="size-4" />
          </span>
        )}
      </div>
      <p className="tnum text-xs text-text-3">
        Page {page} of {pages}
      </p>
    </nav>
  );
}
