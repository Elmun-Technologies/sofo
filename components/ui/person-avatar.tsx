import Image from "next/image";
import { imageUrl } from "@/lib/images";
import { initials } from "@/lib/format";

/** Round person avatar: TMDB profile photo when we have one, otherwise initials. */
export function PersonAvatar({ name, photoPath, size = 48, className = "" }: { name: string; photoPath?: string | null; size?: number; className?: string }) {
  const src = imageUrl(photoPath, size > 100 ? "w342" : "w185");
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface font-normal tracking-[-0.05em] text-text-2 ring-1 ring-hairline-strong ring-inset ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * (src ? 0.34 : 0.34)) }}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover object-top" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
