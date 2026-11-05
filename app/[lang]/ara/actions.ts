"use server";

import type { RequestState } from "@/components/search/request-title-form";
import { getEdition } from "@/lib/editions";
import { recordSearch } from "@/lib/search";

/**
 * "Request this title": stored as an aggregate SearchStat row (zeroResults = true) — no email,
 * no IP, no personal data. Editors see the most requested missing titles in the admin queue.
 */
export async function requestTitle(_prev: RequestState, form: FormData): Promise<RequestState> {
  const edition = getEdition(String(form.get("lang") ?? ""));
  const title = String(form.get("title") ?? "").replace(/\s+/g, " ").trim();
  // Honeypot: bots fill every field; pretend success.
  if (form.get("website")) return { status: "done", title };
  if (!edition) return { status: "error", message: "Unknown edition." };
  if (title.length < 2) return { status: "error", message: "Type the title you are looking for." };
  if (title.length > 100) return { status: "error", message: "That is a bit long — 100 characters max." };
  await recordSearch(edition, title, true);
  return { status: "done", title };
}
