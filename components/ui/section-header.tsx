import Link from "next/link";

type Props = { title: React.ReactNode; href?: string; sub?: React.ReactNode; linkLabel?: string; as?: "h2" | "h3"; id?: string };

export function SectionHeader({ title, href, sub, linkLabel = "See all", as: H = "h2", id }: Props) {
  return (
    <div className="mb-3.5 flex items-baseline gap-3 md:mb-4">
      <H id={id} className="text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
        {title}
      </H>
      {sub ? <span className="hidden text-sm text-text-2 sm:inline">{sub}</span> : null}
      {href ? (
        <Link href={href} className="ml-auto shrink-0 text-sm font-bold text-text-2">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}
