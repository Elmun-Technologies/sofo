import Link from "next/link";
import { ChevronRightIcon } from "../icons";

type Props = { title: React.ReactNode; href?: string; sub?: React.ReactNode; linkLabel?: string; as?: "h2" | "h3"; id?: string; className?: string; action?: React.ReactNode };

/** Row heading. With `href` the title itself is the link (chevron slides on hover) — one target, no "See all" clutter. */
export function SectionHeader({ title, href, sub, linkLabel = "See all", as: H = "h2", id, className = "", action }: Props) {
  return (
    <div className={`mb-4 flex items-end gap-4 md:mb-5 ${className}`}>
      <div className="min-w-0 flex-1">
        <H id={id} className="text-h2">
          {href ? (
            <Link href={href} className="group/all inline-flex items-center gap-1 hover:text-text" title={linkLabel}>
              <span>{title}</span>
              <ChevronRightIcon className="mt-0.5 size-5 shrink-0 text-text-3 transition duration-200 group-hover/all:translate-x-1 group-hover/all:text-text" />
            </Link>
          ) : (
            title
          )}
        </H>
        {sub ? <p className="mt-1 text-[13px] text-text-3 md:text-sm">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}
