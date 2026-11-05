"use server";
/**
 * Admin mutations. Every action re-checks auth (requireAdmin) — proxy.ts is the first gate.
 * All input comes from FormData and is validated here.
 */
import type { ReportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "../db";
import { paths } from "../editions";
import { slugify } from "../slug";
import { editionForList } from "./edition";
import { requireAdmin } from "./guard";
import { parseTmdbInput, posInt, SLUG_RE, str, type ActionState } from "./validate";

const fail = (message: string): ActionState => ({ ok: false, message });
const done = (message: string): ActionState => ({ ok: true, message });

// ───────────────────────── Reports ─────────────────────────

const NEXT_STATUS: ReportStatus[] = ["rechecking", "fixed", "rejected"];

export async function setReportStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = posInt(fd.get("id"));
  const status = str(fd, "status") as ReportStatus;
  if (!id || !NEXT_STATUS.includes(status)) return fail("Invalid request");
  const report = await db.errorReport.findUnique({ where: { id }, select: { id: true } });
  if (!report) return fail("Report not found");
  await db.errorReport.update({
    where: { id },
    data: { status, resolvedAt: status === "fixed" || status === "rejected" ? new Date() : null },
  });
  revalidatePath("/admin", "layout");
  return done(`Marked ${status}`);
}

// ───────────────────────── TMDB link ─────────────────────────

export async function linkTmdbId(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const titleId = posInt(fd.get("titleId"));
  const parsed = parseTmdbInput(str(fd, "tmdbId", 300));
  if (!titleId) return fail("Invalid title");
  if (!parsed) return fail("Enter a TMDB id (digits) or a themoviedb.org URL");

  const title = await db.title.findUnique({ where: { id: titleId }, select: { id: true, type: true, tmdbId: true } });
  if (!title) return fail("Title not found");
  if (parsed.type && parsed.type !== title.type) return fail(`That URL is a TMDB ${parsed.type}, this title is a ${title.type}`);
  if (parsed.id === title.tmdbId) return done("Already linked to this TMDB id");

  const clash = await db.title.findUnique({
    where: { tmdbId_type: { tmdbId: parsed.id, type: title.type } },
    select: { id: true, originalTitle: true },
  });
  if (clash) return fail(`TMDB ${title.type}/${parsed.id} is already linked to “${clash.originalTitle}” (#${clash.id})`);

  try {
    await db.title.update({ where: { id: titleId }, data: { tmdbId: parsed.id } });
  } catch {
    return fail("Could not save (TMDB id already in use?)");
  }
  revalidatePath("/admin", "layout");
  return done(`Linked to TMDB ${title.type}/${parsed.id} — metadata ingest will refresh it`);
}

// ───────────────────────── Lists ─────────────────────────

async function uniqueSlug(lang: string, base: string, exceptId?: number): Promise<string> {
  const root = base.slice(0, 80) || "list";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const hit = await db.list.findUnique({ where: { lang_slug: { lang, slug: candidate } }, select: { id: true } });
    if (!hit || hit.id === exceptId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function revalidateList(listId: number) {
  const list = await db.list.findUnique({ where: { id: listId }, select: { lang: true, countryCode: true, slug: true } });
  revalidatePath(`/admin/lists/${listId}`);
  revalidatePath("/admin/lists");
  const e = list && editionForList(list.lang, list.countryCode);
  if (e && list) {
    revalidatePath(paths.list(e, list.slug));
    revalidatePath(e.routes.dubHub);
  }
}

export async function createList(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const lang = str(fd, "lang", 8);
  const countryCode = str(fd, "country", 2);
  const name = str(fd, "name", 160);
  if (!editionForList(lang, countryCode)) return fail("Unknown edition");
  if (name.length < 3) return fail("Name must be at least 3 characters");
  const slug = await uniqueSlug(lang, slugify(name));
  const list = await db.list.create({ data: { lang, countryCode, name, slug, intro: "", isPublished: false } });
  revalidatePath("/admin/lists");
  redirect(`/admin/lists/${list.id}`);
}

export async function saveList(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = posInt(fd.get("id"));
  if (!id) return fail("Invalid list");
  const list = await db.list.findUnique({ where: { id }, include: { _count: { select: { items: true } } } });
  if (!list) return fail("List not found");

  const name = str(fd, "name", 160);
  const intro = str(fd, "intro", 3000);
  const rawSlug = str(fd, "slug", 120);
  const publish = fd.get("published") === "on";

  if (name.length < 3) return fail("Name must be at least 3 characters");
  const slug = rawSlug ? slugify(rawSlug) : await uniqueSlug(list.lang, slugify(name), id);
  if (!SLUG_RE.test(slug)) return fail("Slug: Latin lowercase letters, digits and hyphens only");
  const clash = await db.list.findUnique({ where: { lang_slug: { lang: list.lang, slug } }, select: { id: true } });
  if (clash && clash.id !== id) return fail(`Slug “${slug}” is already used by another list`);
  if (publish && intro.length < 40) return fail("A published list needs a human-written intro (40+ characters)");
  if (publish && list._count.items === 0) return fail("Add at least one title before publishing");

  await db.list.update({ where: { id }, data: { name, intro, slug, isPublished: publish } });
  // Old public URL must stop serving the list too.
  const e = editionForList(list.lang, list.countryCode);
  if (e && list.slug !== slug) revalidatePath(paths.list(e, list.slug));
  await revalidateList(id);
  return done(publish ? "Saved and published" : "Saved as draft");
}

/** Re-number positions 1..n in the current order. */
async function normalizePositions(listId: number) {
  const items = await db.listItem.findMany({ where: { listId }, orderBy: [{ position: "asc" }, { titleId: "asc" }], select: { titleId: true, position: true } });
  await db.$transaction(
    items
      .map((it, i) => ({ ...it, next: i + 1 }))
      .filter((it) => it.position !== it.next)
      .map((it) => db.listItem.update({ where: { listId_titleId: { listId, titleId: it.titleId } }, data: { position: it.next } })),
  );
  return items.map((it) => it.titleId);
}

export async function addListItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const listId = posInt(fd.get("listId"));
  const titleId = posInt(fd.get("titleId"));
  if (!listId || !titleId) return fail("Invalid request");
  const list = await db.list.findUnique({ where: { id: listId }, select: { lang: true } });
  if (!list) return fail("List not found");
  const loc = await db.titleLocalization.findUnique({ where: { titleId_lang: { titleId, lang: list.lang } }, select: { name: true } });
  if (!loc) return fail("Title has no localization in this edition");
  const exists = await db.listItem.findUnique({ where: { listId_titleId: { listId, titleId } } });
  if (exists) return fail("Already in the list");
  const max = await db.listItem.aggregate({ where: { listId }, _max: { position: true } });
  await db.listItem.create({ data: { listId, titleId, position: (max._max.position ?? 0) + 1 } });
  await revalidateList(listId);
  return done(`Added “${loc.name}”`);
}

export async function moveListItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const listId = posInt(fd.get("listId"));
  const titleId = posInt(fd.get("titleId"));
  const dir = str(fd, "dir");
  if (!listId || !titleId || (dir !== "up" && dir !== "down")) return fail("Invalid request");
  const order = await normalizePositions(listId);
  const i = order.indexOf(titleId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= order.length) return null;
  const other = order[j]!;
  await db.$transaction([
    db.listItem.update({ where: { listId_titleId: { listId, titleId } }, data: { position: j + 1 } }),
    db.listItem.update({ where: { listId_titleId: { listId, titleId: other } }, data: { position: i + 1 } }),
  ]);
  await revalidateList(listId);
  return null;
}

export async function removeListItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const listId = posInt(fd.get("listId"));
  const titleId = posInt(fd.get("titleId"));
  if (!listId || !titleId) return fail("Invalid request");
  await db.listItem.deleteMany({ where: { listId, titleId } });
  await normalizePositions(listId);
  const left = await db.listItem.count({ where: { listId } });
  if (left === 0) await db.list.update({ where: { id: listId }, data: { isPublished: false } });
  await revalidateList(listId);
  return done(left === 0 ? "Removed — list is empty, unpublished" : "Removed");
}

export async function saveBlurb(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const listId = posInt(fd.get("listId"));
  const titleId = posInt(fd.get("titleId"));
  const blurb = str(fd, "blurb", 400);
  if (!listId || !titleId) return fail("Invalid request");
  if (blurb.length > 280) return fail("Blurb: max 280 characters");
  const res = await db.listItem.updateMany({ where: { listId, titleId }, data: { blurb: blurb || null } });
  if (res.count === 0) return fail("Item not found");
  await db.list.update({ where: { id: listId }, data: { updatedAt: new Date() } });
  await revalidateList(listId);
  return done("Blurb saved");
}
