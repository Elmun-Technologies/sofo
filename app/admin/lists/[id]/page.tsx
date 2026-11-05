import Link from "next/link";
import { notFound } from "next/navigation";
import { EditionLabel } from "@/components/admin/edition-label";
import { AddTitleButton, BlurbForm, ListMetaForm, MoveButtons, RemoveButton } from "@/components/admin/list-forms";
import { AdminHeader, inputClass, Panel, Tag } from "@/components/admin/ui";
import { PosterImage } from "@/components/ui/poster-image";
import { adminEdition } from "@/lib/admin/edition";
import { getListEditor, searchTitlesForList } from "@/lib/admin/queries";
import { paths } from "@/lib/editions";
import { dubTerm } from "@/lib/lang";
import { posInt } from "@/lib/admin/validate";

export const metadata = { title: "List editor" };

export default async function AdminListEditor({ params, searchParams }: PageProps<"/admin/lists/[id]">) {
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams]);
  const e = adminEdition(sp.edition);
  const id = posInt(rawId);
  if (!id) notFound();
  const data = await getListEditor(e, id);
  if (!data) notFound();
  const { list, items } = data;

  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const results = q ? await searchTitlesForList(e, q, items.map((i) => i.titleId)) : [];
  const passing = items.filter((i) => i.gate.index).length;
  const failing = items.length - passing;
  const publicPath = paths.list(e, list.slug);
  const pathPrefix = publicPath.slice(0, publicPath.lastIndexOf("/"));
  const listIndexable = list.isPublished && items.some((i) => i.services > 0);

  return (
    <>
      <AdminHeader
        title="List editor"
        right={
          <span className="flex items-center gap-3">
            <Link href="/admin/lists" className="text-text-2">
              ← All lists
            </Link>
            <EditionLabel edition={e} />
          </span>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_412px] xl:items-start">
        <Panel>
          <ListMetaForm id={list.id} name={list.name} slug={list.slug} intro={list.intro} published={list.isPublished} pathPrefix={pathPrefix} />

          <h2 className="mt-8 mb-3 text-xs font-extrabold tracking-[0.12em] text-text-3 uppercase">Items · {items.length}</h2>
          <ol className="space-y-2">
            {items.map((it, idx) => (
              <li key={it.titleId} className="flex items-center gap-3 rounded-card bg-ink/60 p-3 sm:gap-4">
                <MoveButtons listId={list.id} titleId={it.titleId} first={idx === 0} last={idx === items.length - 1} />
                <span className="w-5 text-center text-base font-extrabold text-text-3 tabular-nums">{idx + 1}</span>
                <PosterImage path={it.posterPath} alt={it.name} sizes="36px" className="w-9 shrink-0 rounded-[6px]" />
                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    {it.slug ? (
                      <Link href={paths.title(e, it.type, it.slug)} target="_blank" className="font-extrabold">
                        {it.name}
                      </Link>
                    ) : (
                      <span className="font-extrabold">{it.name}</span>
                    )}
                    <span className="text-xs text-text-3">{it.year}</span>
                  </div>
                  <BlurbForm listId={list.id} titleId={it.titleId} blurb={it.blurb} />
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  {it.services > 0 ? (
                    <Tag tone={it.dub ? "good" : "default"}>
                      {it.dub ? `${dubTerm(e.contentLang)} ✓ · ` : ""}
                      {it.services} service{it.services > 1 ? "s" : ""}
                    </Tag>
                  ) : (
                    <Tag tone="warn">no offer in {e.country}</Tag>
                  )}
                  {!it.gate.index ? <span className="text-[11px] text-leaving" title={it.gate.reasons.join(", ")}>gate: {it.gate.reasons[0]}</span> : null}
                </div>
                <RemoveButton listId={list.id} titleId={it.titleId} />
              </li>
            ))}
          </ol>

          <div className="mt-3 rounded-card border border-dashed border-line p-3">
            <form method="get" className="flex gap-2">
              <label htmlFor="q" className="sr-only">
                Search titles
              </label>
              <input id="q" name="q" defaultValue={q} minLength={2} maxLength={100} placeholder="+ Add title (search by name)" className={inputClass} />
              <button type="submit" className="h-11 rounded-button bg-surface-2 px-4 text-sm font-extrabold hover:bg-line">
                Search
              </button>
            </form>
            {q ? (
              results.length === 0 ? (
                <p className="mt-3 text-sm text-text-3">No titles match “{q}” (or all are already in the list).</p>
              ) : (
                <ul className="mt-3 divide-y divide-line-soft">
                  {results.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2">
                      <PosterImage path={r.posterPath} alt={r.name} sizes="28px" className="w-7 shrink-0 rounded-[4px]" />
                      <span className="min-w-0 grow truncate text-sm font-bold">
                        {r.name} <span className="font-normal text-text-3">· {r.year ?? "—"} · {r.type}</span>
                      </span>
                      <AddTitleButton listId={list.id} titleId={r.id} />
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Publish">
            <dl className="space-y-3 text-[15px]">
              <div className="flex items-center justify-between">
                <dt>Status</dt>
                <dd>{list.isPublished ? <Tag tone="good">Published</Tag> : <Tag>Draft</Tag>}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Quality gate</dt>
                <dd>
                  <Tag tone={failing === 0 && items.length > 0 ? "good" : "warn"}>
                    {passing} / {items.length} pass
                  </Tag>
                </dd>
              </div>
            </dl>
            {failing > 0 ? (
              <p className="mt-3 text-xs text-leaving">
                {failing} title{failing > 1 ? "s" : ""} fail the gate (noindex page) — consider replacing.
              </p>
            ) : null}
            <p className="mt-3 text-xs text-text-3">Toggle “Published” and save in the form. Publishing needs an intro (40+ chars) and at least one title.</p>
            {list.isPublished ? (
              <Link href={publicPath} target="_blank" className="mt-4 flex h-11 items-center rounded-button bg-surface-2 px-4 text-[15px] font-extrabold hover:bg-line hover:text-text">
                Preview ↗
              </Link>
            ) : null}
          </Panel>
          <Panel title="SEO">
            <p className="text-sm leading-relaxed text-text-2">
              URL: <span className="text-text">{publicPath}</span>
              <br />
              Index: <b className="text-text">{listIndexable ? "index" : "noindex"}</b>
              {list.isPublished ? (listIndexable ? "" : " (no available items)") : " (draft — not public)"} · hreflang: {e.hreflang}
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
