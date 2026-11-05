"use client";
import { addListItem, createList, moveListItem, removeListItem, saveBlurb, saveList } from "@/lib/admin/actions";
import { slugify } from "@/lib/slug";
import { useState } from "react";
import { ActionForm, SubmitButton } from "./action-form";

const input = "h-11 w-full rounded-input border border-line bg-ink px-3.5 text-[15px] text-text placeholder:text-text-3 focus:border-orange focus:outline-none";

export function CreateListForm({ lang, country }: { lang: string; country: string }) {
  return (
    <ActionForm action={createList} className="flex flex-col gap-2 sm:flex-row" messageClassName="sm:self-center">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="country" value={country} />
      <label htmlFor="new-list" className="sr-only">
        New list name
      </label>
      <input id="new-list" name="name" required minLength={3} maxLength={160} placeholder="New list name, e.g. Türkçe dublaj Pixar filmleri" className={input} />
      <SubmitButton variant="primary" className="h-11 px-4">
        Create list
      </SubmitButton>
    </ActionForm>
  );
}

/** Main list form (name, slug auto from name, intro, published). Submitted from the Publish panel too (form attr). */
export function ListMetaForm({
  id,
  name,
  slug,
  intro,
  published,
  pathPrefix,
}: {
  id: number;
  name: string;
  slug: string;
  intro: string;
  published: boolean;
  pathPrefix: string;
}) {
  const [nameVal, setName] = useState(name);
  const [slugVal, setSlug] = useState(slug);
  const [auto, setAuto] = useState(slug === slugify(name));
  return (
    <ActionForm action={saveList} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-text-2">Title (edition language)</span>
        <input
          name="name"
          required
          minLength={3}
          maxLength={160}
          value={nameVal}
          onChange={(ev) => {
            setName(ev.target.value);
            if (auto) setSlug(slugify(ev.target.value));
          }}
          className={input}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-[13px] font-bold text-text-2">
          Slug
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-3">
            <input type="checkbox" checked={auto} onChange={(ev) => setAuto(ev.target.checked)} className="accent-orange" /> auto from title
          </span>
        </span>
        <div className="flex h-11 items-center rounded-input border border-line bg-ink focus-within:border-orange">
          <span className="truncate pl-3.5 text-[15px] text-text-3">{pathPrefix}/</span>
          <input
            name="slug"
            value={slugVal}
            readOnly={auto}
            onChange={(ev) => setSlug(ev.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={120}
            className="h-full min-w-0 grow bg-transparent pr-3.5 text-[15px] focus:outline-none read-only:text-text-2"
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-text-2">Intro — human-written</span>
        <textarea name="intro" defaultValue={intro} rows={4} maxLength={3000} className={`${input} h-auto py-3 leading-relaxed`} />
        <span className="mt-1 block text-xs text-text-3">No AI or machine-translated text (SEO rules). 40+ characters to publish.</span>
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="published" defaultChecked={published} className="size-4 accent-orange" /> Published
      </label>
      <SubmitButton variant="primary" className="h-11 w-full px-4 sm:w-auto">
        Save list
      </SubmitButton>
    </ActionForm>
  );
}

export function MoveButtons({ listId, titleId, first, last }: { listId: number; titleId: number; first: boolean; last: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {(["up", "down"] as const).map((dir) => (
        <ActionForm key={dir} action={moveListItem}>
          <input type="hidden" name="listId" value={listId} />
          <input type="hidden" name="titleId" value={titleId} />
          <input type="hidden" name="dir" value={dir} />
          <SubmitButton variant="ghost" className={`h-7 w-8 px-0 ${(dir === "up" ? first : last) ? "invisible" : ""}`} title={dir === "up" ? "Move up" : "Move down"}>
            {dir === "up" ? "↑" : "↓"}
          </SubmitButton>
        </ActionForm>
      ))}
    </div>
  );
}

export function RemoveButton({ listId, titleId }: { listId: number; titleId: number }) {
  return (
    <ActionForm action={removeListItem}>
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="titleId" value={titleId} />
      <SubmitButton variant="danger" className="h-8" title="Remove from list">
        ✕
      </SubmitButton>
    </ActionForm>
  );
}

export function BlurbForm({ listId, titleId, blurb }: { listId: number; titleId: number; blurb: string | null }) {
  return (
    <ActionForm action={saveBlurb} className="mt-1.5 flex w-full flex-wrap items-center gap-2" messageClassName="basis-full">
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="titleId" value={titleId} />
      <label className="sr-only" htmlFor={`blurb-${titleId}`}>
        Blurb
      </label>
      <input
        id={`blurb-${titleId}`}
        name="blurb"
        defaultValue={blurb ?? ""}
        maxLength={280}
        placeholder="Short human-written blurb…"
        className="h-8 min-w-0 grow rounded-[8px] border border-transparent bg-transparent px-2 text-[13px] text-text-2 placeholder:text-text-3 hover:border-line focus:border-orange focus:outline-none"
      />
      <SubmitButton variant="ghost" className="h-8">
        Save
      </SubmitButton>
    </ActionForm>
  );
}

export function AddTitleButton({ listId, titleId }: { listId: number; titleId: number }) {
  return (
    <ActionForm action={addListItem} className="flex items-center gap-2" messageClassName="whitespace-nowrap">
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="titleId" value={titleId} />
      <SubmitButton variant="primary" className="h-8">
        + Add
      </SubmitButton>
    </ActionForm>
  );
}
