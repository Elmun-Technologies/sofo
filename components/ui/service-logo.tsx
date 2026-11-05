import Image from "next/image";
import { serviceStyle } from "@/lib/services";

type Props = { slug: string; name: string; logoPath?: string | null; size?: number; className?: string };

/** Square service tile: sample logo file when we have one, otherwise a brand-coloured wordmark. */
export function ServiceLogo({ slug, name, logoPath, size = 32, className = "" }: Props) {
  const style = serviceStyle(slug);
  const radius = Math.round(size * 0.24);
  if (logoPath) {
    return (
      <Image
        src={logoPath}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 object-cover ${className}`}
        style={{ borderRadius: radius, width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center font-extrabold tracking-tight ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: style.bg,
        color: style.fg,
        fontSize: Math.max(8, Math.round(size * (style.short.length > 3 ? 0.27 : 0.36))),
      }}
    >
      {style.short}
    </span>
  );
}
