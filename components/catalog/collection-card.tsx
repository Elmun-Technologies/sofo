import Image from "next/image";
import Link from "next/link";
import { paths, type Edition } from "@/lib/editions";
import { imageUrl } from "@/lib/images";

type Props = {
  edition: Edition;
  list: { slug: string; name: string; author?: string | null; _count: { items: number }; items: { title: { posterPath: string | null } }[] };
};

/** Collection cover: 4-poster collage + name + count. */
export function CollectionCard({ edition, list }: Props) {
  const posters = list.items.map((i) => imageUrl(i.title.posterPath)).filter((p): p is string => !!p);
  return (
    <Link href={paths.list(edition, list.slug)} className="group relative block overflow-hidden rounded-card bg-surface ring-1 ring-hairline ring-inset hover:text-text" lang={edition.hreflang}>
      <div className="grid aspect-[16/10] grid-cols-4 gap-px">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden bg-surface-2">
            {posters[i] ? (
              <Image src={posters[i]} alt="" fill sizes="120px" className="object-cover transition duration-500 ease-out group-hover:scale-105" style={{ transitionDelay: `${i * 40}ms` }} />
            ) : null}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/5" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 text-[17px] leading-snug font-medium tracking-[-0.01em]">{list.name}</h3>
        <p lang="en" className="tnum mt-1 text-xs font-semibold text-white/65">
          {list._count.items} titles{list.author ? ` · by ${list.author}` : ""}
        </p>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-card ring-1 ring-black/5 transition duration-200 ring-inset group-hover:ring-2 group-hover:ring-orange" />
    </Link>
  );
}
