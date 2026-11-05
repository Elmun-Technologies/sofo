import Link from "next/link";
import { paths, type Edition } from "@/lib/editions";
import { initials } from "@/lib/format";
import type { TitlePageData } from "@/lib/queries/title";

/** Cast & crew with initials only — no person photos (licensing). */
export function Cast({ data, edition }: { data: TitlePageData; edition: Edition }) {
  const people = new Map<number, { name: string; slug: string; roles: string[] }>();
  for (const c of data.title.credits) {
    const p = people.get(c.personId) ?? { name: c.person.name, slug: c.person.slug, roles: [] };
    p.roles.push(c.character ? `${c.character}${c.job === "Voice" ? " (voice)" : ""}` : c.job.toLowerCase());
    people.set(c.personId, p);
  }
  if (people.size === 0) return null;
  return (
    <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:gap-6 md:px-0">
      {[...people.values()].slice(0, 12).map((p) => (
        <li key={p.slug} className="w-[92px] shrink-0 text-center md:w-[112px]">
          <Link href={paths.person(edition, p.slug)} className="group block hover:text-text">
            <span aria-hidden="true" className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-orange-deep text-2xl font-extrabold text-orange ring-orange transition group-hover:ring-2 md:size-[84px] md:text-[28px]">
              {initials(p.name)}
            </span>
            <span className="mt-2 block truncate text-sm font-bold">{p.name}</span>
            <span className="block truncate text-xs text-text-2 capitalize">{p.roles.join(", ")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
