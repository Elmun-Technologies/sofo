import Link from "next/link";
import { EditionLabel } from "@/components/admin/edition-label";
import { CreateListForm } from "@/components/admin/list-forms";
import { AdminHeader, Panel, Tag } from "@/components/admin/ui";
import { adminEdition } from "@/lib/admin/edition";
import { getAdminLists } from "@/lib/admin/queries";
import { paths } from "@/lib/editions";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Lists" };

export default async function AdminLists({ searchParams }: PageProps<"/admin/lists">) {
  const e = adminEdition((await searchParams).edition);
  const lists = await getAdminLists(e);

  return (
    <>
      <AdminHeader title="Lists" right={<EditionLabel edition={e} />} />
      <Panel title="New list" className="mb-3">
        <CreateListForm lang={e.contentLang} country={e.country} />
      </Panel>
      <Panel title={`Lists · ${lists.length}`}>
        {lists.length === 0 ? <p className="py-2 text-sm text-text-3">No lists yet — create the first one above.</p> : null}
        <ul className="-my-1">
          {lists.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 border-b border-hairline py-4 last:border-0 sm:flex-row sm:items-center sm:gap-6">
              <div className="min-w-0 grow">
                <Link href={`/admin/lists/${l.id}`} className="text-[15px] font-medium">
                  {l.name}
                </Link>
                <div className="mt-0.5 truncate text-xs text-text-3">{paths.list(e, l.slug)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tnum text-xs text-text-3">
                  {l._count.items} items · updated {formatDate(l.updatedAt, { day: "numeric", month: "short" })}
                </span>
                {l.isPublished ? <Tag tone="good">Published</Tag> : <Tag>Draft</Tag>}
                <Link href={`/admin/lists/${l.id}`} className="ml-auto inline-flex h-9 items-center rounded-full bg-text/10 px-4 text-[13px] font-medium transition-colors duration-200 hover:bg-text/16">
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
