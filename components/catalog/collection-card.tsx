import Link from "next/link";
import { paths, type Edition } from "@/lib/editions";
import { imageUrl } from "@/lib/images";
import Image from "next/image";

type Props = {
  edition: Edition;
  list: { slug: string; name: string; _count: { items: number }; items: { title: { posterPath: string | null } }[] };
};

/** Collection cover: 4-poster collage + name + count. */
export function CollectionCard({ edition, list }: Props) {
  const posters = list.items.map((i) => imageUrl(i.title.posterPath)).filter((p): p is string => !!p);
  return (
    <Link href={paths.list(edition, list.slug)} className="group relative block overflow-hidden rounded-card border border-line bg-surface hover:text-text">
      <div className="grid aspect-[16/8] grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden bg-surface-2">
            {posters[i] ? (
              <Image src={posters[i]} alt="" fill sizes="120px" className="object-cover transition duration-300 group-hover:scale-105" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="line-clamp-2 text-[17px] leading-snug font-extrabold group-hover:text-orange-tint">{list.name}</h3>
        <p className="mt-0.5 text-xs text-text-2">{list._count.items} titles</p>
      </div>
    </Link>
  );
}
