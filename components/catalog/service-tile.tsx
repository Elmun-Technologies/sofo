import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ServiceLogo } from "@/components/ui/service-logo";

type Props = { href: string; slug: string; name: string; logoPath: string | null; count: number; label: string };

/** "By service" bento tile: logo, name and an oversized light count. */
export function ServiceTile({ href, slug, name, logoPath, count, label }: Props) {
  const none = count === 0;
  return (
    <Link href={href} className="card card-hover group flex h-full min-h-[136px] flex-col justify-between gap-6 p-4 md:min-h-[176px] md:p-5">
      <span className="flex items-start justify-between gap-3">
        <ServiceLogo slug={slug} name="" logoPath={logoPath} size={40} className={none ? "opacity-50" : ""} />
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full text-text-3 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset group-hover:bg-white group-hover:text-ink group-hover:ring-transparent"
        >
          <ArrowRightIcon className="size-4" />
        </span>
      </span>
      <span className="flex items-end justify-between gap-2">
        <span className="min-w-0 pb-0.5">
          <span className={`block truncate text-[15px] font-semibold ${none ? "text-text-2" : ""}`}>{name}</span>
          <span className="block truncate text-xs text-text-3">{label}</span>
        </span>
        <span className={`shrink-0 text-[40px] leading-[0.9] font-normal tracking-[-0.05em] md:text-[52px] ${none ? "text-text-3/60" : ""}`}>{count.toLocaleString("en-US")}</span>
      </span>
    </Link>
  );
}
