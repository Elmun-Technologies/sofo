import Image from "next/image";
import { imageUrl } from "@/lib/images";

type Props = { path: string | null; alt: string; sizes?: string; priority?: boolean; className?: string };

/** 2:3 poster; falls back to a typographic placeholder when no artwork exists. */
export function PosterImage({ path, alt, sizes = "(max-width: 480px) 33vw, (max-width: 1024px) 20vw, 180px", priority, className = "" }: Props) {
  const src = imageUrl(path, "w342");
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-2 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-end bg-gradient-to-br from-surface-2 to-orange-deep p-3">
          <span className="line-clamp-3 text-sm font-extrabold">{alt}</span>
        </div>
      )}
    </div>
  );
}
