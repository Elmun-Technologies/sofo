import type { NextRequest } from "next/server";
import { subscribe, SubscribeError } from "@/lib/alerts/subscribe";
import { isSameOrigin, parseSubscribeInput } from "@/lib/alerts/validate";

// Small in-memory limiter (per instance) — enough to stop accidental floods; edge rate limits come later.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** POST { contact, edition, alerts: [{ titleId, kinds }], ref?, website? } → subscribe to alerts. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers.get("origin"), req.headers.get("host"), process.env.NEXT_PUBLIC_SITE_URL)) {
    return json({ ok: false, error: "Invalid request." }, 403);
  }
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ ok: false, error: "Invalid request." }, 415);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return json({ ok: false, error: "Too many attempts. Try again in a minute." }, 429);

  const text = await req.text();
  if (text.length > 20_000) return json({ ok: false, error: "Request too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const parsed = parseSubscribeInput(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  try {
    const r = await subscribe(parsed.value);
    return json({ ok: true, status: r.status, message: r.message, telegramLink: r.telegramLink, ref: r.ref, alerts: r.alerts });
  } catch (err) {
    if (err instanceof SubscribeError) return json({ ok: false, error: err.message }, 400);
    console.error("[api/subscribe]", err);
    return json({ ok: false, error: "Something broke on our side. Try again in a minute." }, 500);
  }
}
