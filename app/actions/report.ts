"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";

const KINDS = ["not_on_service", "wrong_language", "wrong_price", "broken_link", "other"] as const;
type Kind = (typeof KINDS)[number];

export type ReportState = { ok: boolean; message: string } | null;

/** "Something wrong?" — queued for re-check within 24h (ErrorReport, admin QA). */
export async function submitReport(_prev: ReportState, form: FormData): Promise<ReportState> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && new URL(origin).host !== h.get("host")) return { ok: false, message: "Invalid request." };

  const titleId = Number(form.get("titleId"));
  const kind = String(form.get("kind")) as Kind;
  const offerIdRaw = form.get("offerId");
  const offerId = offerIdRaw ? Number(offerIdRaw) : null;
  const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;
  if (!Number.isInteger(titleId) || !KINDS.includes(kind)) return { ok: false, message: "Please pick what's wrong." };

  const title = await db.title.findUnique({ where: { id: titleId }, select: { id: true } });
  if (!title) return { ok: false, message: "Unknown title." };
  const offer = offerId && Number.isInteger(offerId) ? await db.offer.findFirst({ where: { id: offerId, titleId }, select: { id: true } }) : null;

  await db.errorReport.create({ data: { titleId, offerId: offer?.id ?? null, kind, note } });
  return { ok: true, message: "Thanks — we'll re-check this within 24 hours." };
}
