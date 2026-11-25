import Image from "next/image";
import { imageUrl } from "@/lib/images";

type Props = { path: string | null; alt: string; sizes?: string; priority?: boolean; className?: string; imgClassName?: string };

/** 2:3 poster; falls back to a typographic placeholder when no artwork exists. */
export function PosterImage({ path, alt, sizes = "(max-width: 480px) 33vw, (max-width: 1024px) 20vw, 190px", priority, className = "", imgClassName = "" }: Props) {
  const src = imageUrl(path, "w342");
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-2 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} />
      ) : (
        <div className="absolute inset-0 flex items-end bg-gradient-to-br from-surface-3 to-surface p-3">
          <span aria-hidden="true" className="absolute top-3 left-3 font-logo text-lg leading-none font-black text-white/15">
            s
          </span>
          <span className="line-clamp-3 text-[13px] leading-snug font-medium text-white/85">{alt}</span>
        </div>
      )}
      {/* Inner hairline keeps dark artwork from melting into the page. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/10 ring-inset" />
    </div>
  );
}
