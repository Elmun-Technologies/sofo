import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";

/** "By service" tile: logo, name, count line. */
export function ServiceTile({ href, slug, name, logoPath, line }: { href: string; slug: string; name: string; logoPath: string | null; line: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3 transition hover:border-text-3 hover:text-text">
      <ServiceLogo slug={slug} name={name} logoPath={logoPath} size={36} />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-extrabold">{name}</span>
        <span className="block truncate text-xs text-text-2">{line}</span>
      </span>
    </Link>
  );
}
