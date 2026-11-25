import { revalidatePath } from "next/cache";
import { safeEqual } from "@/lib/admin/auth";
import { runtimeEnv } from "@/lib/runtime";

export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate  (Authorization: Bearer $INGEST_TOKEN) — drops the ISR cache of every page.
 * Ingest scripts that write the database directly (self-hosted daily refresh, ADR 0003) call it last,
 * so pages rendered before the import (e.g. an empty home page) don't stay cached for an hour.
 * 404 when INGEST_TOKEN is not configured.
 */
export async function POST(req: Request) {
  const token = (runtimeEnv().INGEST_TOKEN as string | undefined) ?? process.env.INGEST_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!(await safeEqual(given, token))) return Response.json({ error: "unauthorized" }, { status: 401 });
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true });
}
