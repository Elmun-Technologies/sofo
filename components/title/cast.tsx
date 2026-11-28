import Link from "next/link";
import { paths, type Edition } from "@/lib/editions";
import { PersonAvatar } from "@/components/ui/person-avatar";
import type { TitlePageData } from "@/lib/queries/title";

/** Cast & crew: TMDB profile photo when we have one, otherwise an initials avatar. */
export function Cast({ data, edition }: { data: TitlePageData; edition: Edition }) {
  const people = new Map<number, { name: string; slug: string; photoPath: string | null; roles: string[] }>();
  for (const c of data.title.credits) {
    const p = people.get(c.personId) ?? { name: c.person.name, slug: c.person.slug, photoPath: c.person.photoPath, roles: [] };
    p.roles.push(c.character ? `${c.character}${c.job === "Voice" ? " (voice)" : ""}` : c.job.toLowerCase());
    people.set(c.personId, p);
  }
  if (people.size === 0) return null;
  return (
    <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0 xl:grid-cols-4">
      {[...people.values()].slice(0, 12).map((p) => (
        <li key={p.slug} className="w-[200px] shrink-0 md:w-auto">
          <Link href={paths.person(edition, p.slug)} className="card card-hover flex items-center gap-3 p-3">
            <PersonAvatar name={p.name} photoPath={p.photoPath} size={48} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{p.name}</span>
              <span className="block truncate text-xs text-text-3 capitalize">{p.roles.join(", ")}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
