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
      <Panel title="New list" className="mb-4">
        <CreateListForm lang={e.contentLang} country={e.country} />
      </Panel>
      <Panel title={`Lists · ${lists.length}`}>
        <ul>
          {lists.map((l) => (
            <li key={l.id} className="flex flex-col gap-2 border-b border-line-soft py-3 last:border-0 sm:flex-row sm:items-center">
              <div className="min-w-0 grow">
                <Link href={`/admin/lists/${l.id}`} className="font-extrabold">
                  {l.name}
                </Link>
                <div className="truncate text-xs text-text-3">{paths.list(e, l.slug)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-text-3">{l._count.items} items · updated {formatDate(l.updatedAt, { day: "numeric", month: "short" })}</span>
                {l.isPublished ? <Tag tone="good">Published</Tag> : <Tag>Draft</Tag>}
                <Link href={`/admin/lists/${l.id}`} className="inline-flex h-9 items-center rounded-button bg-surface-2 px-3 text-[13px] font-extrabold hover:bg-line hover:text-text">
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
