import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ServiceLogo } from "@/components/ui/service-logo";

type Props = { href: string; slug: string; name: string; logoPath: string | null; label: string; labelLang?: string; dim?: boolean };

/** "By service" bento tile: logo, name and what the page lists (no counts — we never show catalogue sizes). */
export function ServiceTile({ href, slug, name, logoPath, label, labelLang, dim }: Props) {
  return (
    <Link href={href} className="card card-hover group flex h-full min-h-[136px] flex-col justify-between gap-6 p-4 md:min-h-[152px] md:p-5">
      <span className="flex items-start justify-between gap-3">
        <ServiceLogo slug={slug} name="" logoPath={logoPath} size={40} className={dim ? "opacity-50" : ""} />
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full text-text-3 ring-1 ring-hairline-strong transition duration-200 ease-out ring-inset group-hover:bg-text group-hover:text-ink group-hover:ring-transparent"
        >
          <ArrowRightIcon className="size-4" />
        </span>
      </span>
      <span className="min-w-0 pb-0.5">
        <span className={`block truncate text-[17px] font-semibold md:text-[19px] ${dim ? "text-text-2" : ""}`}>{name}</span>
        <span lang={labelLang} className="block truncate text-xs text-text-3">
          {label}
        </span>
      </span>
    </Link>
  );
}
