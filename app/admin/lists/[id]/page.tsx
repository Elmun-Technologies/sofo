import Link from "next/link";
import { notFound } from "next/navigation";
import { EditionLabel } from "@/components/admin/edition-label";
import { AddTitleButton, BlurbForm, ListMetaForm, MoveButtons, RemoveButton } from "@/components/admin/list-forms";
import { AdminHeader, inputClass, Panel, PanelLabel, Tag } from "@/components/admin/ui";
import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, SearchIcon } from "@/components/icons";
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
          <>
            <Link href="/admin/lists" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-2">
              <ArrowLeftIcon className="size-4" />
              All lists
            </Link>
            <EditionLabel edition={e} />
          </>
        }
      />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <Panel>
          <ListMetaForm id={list.id} name={list.name} slug={list.slug} intro={list.intro} published={list.isPublished} pathPrefix={pathPrefix} />

          <PanelLabel className="tnum mt-10 mb-3 border-t border-hairline pt-6">Items · {items.length}</PanelLabel>
          <ol className="space-y-1.5">
            {items.map((it, idx) => (
              <li key={it.titleId} className="flex items-center gap-3 rounded-card border border-hairline bg-white/[0.02] p-3 sm:gap-4 sm:pr-4">
                <MoveButtons listId={list.id} titleId={it.titleId} first={idx === 0} last={idx === items.length - 1} />
                <span className="tnum w-6 shrink-0 text-center text-sm text-text-3">{String(idx + 1).padStart(2, "0")}</span>
                <PosterImage path={it.posterPath} alt={it.name} sizes="40px" className="w-10 shrink-0 !rounded-[6px]" />
                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    {it.slug ? (
                      <Link href={paths.title(e, it.type, it.slug)} target="_blank" className="font-medium">
                        {it.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{it.name}</span>
                    )}
                    <span className="tnum text-xs text-text-3">{it.year}</span>
                  </div>
                  <BlurbForm listId={list.id} titleId={it.titleId} blurb={it.blurb} />
                </div>
                <div className="hidden w-[176px] shrink-0 flex-col items-end gap-1.5 sm:flex">
                  {it.services > 0 ? (
                    <Tag tone={it.dub ? "good" : "default"}>
                      {it.dub ? (
                        <>
                          <CheckIcon className="size-3 stroke-[3]" />
                          {dubTerm(e.contentLang)} ·{" "}
                        </>
                      ) : null}
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

          <div className="mt-3 rounded-card border border-dashed border-hairline-strong p-3">
            <form method="get" className="flex gap-2">
              <label htmlFor="q" className="sr-only">
                Search titles
              </label>
              <span className="relative min-w-0 grow">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-text-3" />
                <input id="q" name="q" defaultValue={q} minLength={2} maxLength={100} placeholder="Add a title — search by name" className={`${inputClass} !rounded-full !pl-11`} />
              </span>
              <button type="submit" className="inline-flex h-[46px] shrink-0 items-center rounded-full bg-white/10 px-5 text-sm font-medium transition-colors duration-200 hover:bg-white/16">
                Search
              </button>
            </form>
            {q ? (
              results.length === 0 ? (
                <p className="mt-3 px-1 text-sm text-text-3">No titles match “{q}” (or all are already in the list).</p>
              ) : (
                <ul className="mt-2 divide-y divide-hairline px-1">
                  {results.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2">
                      <PosterImage path={r.posterPath} alt={r.name} sizes="28px" className="w-7 shrink-0 !rounded-[4px]" />
                      <span className="min-w-0 grow truncate text-sm font-medium">
                        {r.name} <span className="tnum font-normal text-text-3">· {r.year ?? "—"} · {r.type}</span>
                      </span>
                      <AddTitleButton listId={list.id} titleId={r.id} />
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        </Panel>

        <div className="space-y-3 xl:sticky xl:top-6">
          <Panel title="Publish">
            <dl className="divide-y divide-hairline text-sm">
              <div className="flex items-center justify-between pb-3 text-text-2">
                <dt>Status</dt>
                <dd>{list.isPublished ? <Tag tone="good">Published</Tag> : <Tag>Draft</Tag>}</dd>
              </div>
              <div className="flex items-center justify-between pt-3 text-text-2">
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
            <p className="mt-4 text-xs leading-relaxed text-text-3">Toggle “Published” and save in the form. Publishing needs an intro (40+ chars) and at least one title.</p>
            {list.isPublished ? (
              <Link href={publicPath} target="_blank" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium transition-colors duration-200 hover:bg-white/16">
                Preview
                <ArrowUpRightIcon className="size-4" />
              </Link>
            ) : null}
          </Panel>
          <Panel title="SEO">
            <dl className="divide-y divide-hairline text-sm">
              <div className="pb-3">
                <dt className="text-xs text-text-3">URL</dt>
                <dd className="mt-1 font-medium break-all">{publicPath}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-text-2">
                <dt>Index</dt>
                <dd className="flex items-center gap-2 text-right">
                  <span className="text-xs text-text-3">{list.isPublished ? (listIndexable ? "" : "no available items") : "draft — not public"}</span>
                  <Tag tone={listIndexable ? "good" : "default"}>{listIndexable ? "index" : "noindex"}</Tag>
                </dd>
              </div>
              <div className="flex items-center justify-between pt-3 text-text-2">
                <dt>hreflang</dt>
                <dd className="font-medium text-text">{e.hreflang}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
