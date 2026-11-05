import type { NextRequest } from "next/server";
import { cardInclude, toCard } from "@/lib/catalog";
import { db } from "@/lib/db";
import { getEdition, paths } from "@/lib/editions";
import { eventHeadline } from "@/lib/alerts/format";
import { eventAlertKind } from "@/lib/alerts/match";
import type { FreshOffer, FreshTitle, ListEvent, TitlesResponse } from "@/lib/alerts/my-list";
import type { LangState } from "@/lib/short-answer";

const MAX_IDS = 100;
const EVENT_DAYS = 30;

/**
 * GET /api/titles?ids=1,2&lang=tr[&events=1] — fresh card + offer data for My list (localStorage ids),
 * and with events=1 the recent AvailabilityEvents for those titles (notifications panel).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const edition = getEdition(sp.get("lang") ?? "");
  if (!edition) return Response.json({ error: "Unknown edition" }, { status: 400 });

  const raw = (sp.get("ids") ?? "").split(",").filter(Boolean);
  if (raw.length > MAX_IDS) return Response.json({ error: `At most ${MAX_IDS} ids` }, { status: 400 });
  const ids = [...new Set(raw.map(Number))].filter((n) => Number.isInteger(n) && n > 0 && n < 2 ** 31);
  if (ids.length === 0) return Response.json({ titles: [], events: [] } satisfies TitlesResponse);

  const rows = await db.title.findMany({ where: { id: { in: ids } }, include: cardInclude(edition) });

  const titles: FreshTitle[] = [];
  for (const row of rows) {
    const card = toCard(row);
    if (!card) continue;
    const offers: FreshOffer[] = row.offers.map((o) => {
      const status = (kind: "audio" | "subtitle"): LangState => o.languages.find((l) => l.kind === kind)?.status ?? "unknown";
      return {
        serviceSlug: o.service.slug,
        serviceName: o.service.name,
        logoPath: o.service.logoPath,
        type: o.type,
        price: o.price === null ? null : Number(o.price),
        currency: o.currency,
        url: o.url,
        audio: status("audio"),
        subtitle: status("subtitle"),
        leavingAt: o.leavingAt?.toISOString() ?? null,
        checkedAt: o.checkedAt.toISOString(),
      };
    });
    const checkedAt = offers.reduce<string | null>((m, o) => (!m || o.checkedAt > m ? o.checkedAt : m), null);
    titles.push({ ...card, href: paths.title(edition, card.type, card.slug), offers, checkedAt });
  }
  const order = new Map(ids.map((id, i) => [id, i]));
  titles.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const body: TitlesResponse = { titles };

  if (sp.get("events") === "1") {
    const since = new Date(Date.now() - EVENT_DAYS * 86_400_000);
    const evs = await db.availabilityEvent.findMany({
      where: { titleId: { in: ids }, countryCode: edition.country, occurredAt: { gte: since } },
      include: { service: { select: { slug: true, name: true } } },
      orderBy: { occurredAt: "desc" },
      take: 40,
    });
    const byId = new Map(titles.map((t) => [t.id, t]));
    const currency = edition.country === "TR" ? "TRY" : null;
    body.events = evs
      .map((e): ListEvent | null => {
        const t = byId.get(e.titleId);
        if (!t) return null;
        const ev = {
          id: e.id.toString(),
          titleId: e.titleId,
          titleName: t.name,
          titlePath: t.href,
          countryCode: e.countryCode,
          serviceSlug: e.service.slug,
          serviceName: e.service.name,
          type: e.type,
          offerType: e.offerType,
          before: e.before,
          after: e.after,
          occurredAt: e.occurredAt,
        };
        const kind = eventAlertKind(ev, edition.contentLang);
        // Removals and other non-alert changes are not "notifications".
        if (!kind) return null;
        return { id: ev.id, titleId: t.id, titleName: t.name, href: t.href, kind, headline: eventHeadline(kind, ev, { lang: edition.contentLang, currency }), occurredAt: e.occurredAt.toISOString() };
      })
      .filter((e): e is ListEvent => e !== null)
      .slice(0, 20);
  }

  return Response.json(body, { headers: { "cache-control": "private, max-age=60" } });
}
