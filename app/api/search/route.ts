import { NextResponse, type NextRequest } from "next/server";
import type { SuggestPayload } from "@/components/search/types";
import { getEdition, paths } from "@/lib/editions";
import { imageUrl } from "@/lib/images";
import { getTrendingSearches, parseAudio, searchAll } from "@/lib/search";

/**
 * Autocomplete: GET /api/search?q=&lang=tr&limit=6[&audio=dub|sub]
 * Empty q → trending searches. Keystrokes are NOT recorded in SearchStat (only the results page is).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const edition = getEdition(sp.get("lang") ?? "tr");
  if (!edition) return NextResponse.json({ error: "unknown edition" }, { status: 404 });
  const q = (sp.get("q") ?? "").slice(0, 200);
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 6, 1), 12);

  const payload: SuggestPayload = { q, suggestion: null, titles: [], people: [], franchises: [], collections: [], trending: [] };

  if (!q.trim()) {
    payload.trending = await getTrendingSearches(edition, 5);
  } else {
    const r = await searchAll(edition, q, { limit, groupLimit: 2, audio: parseAudio(sp.get("audio")) });
    payload.q = r.query;
    payload.suggestion = r.suggestion ? { name: r.suggestion, href: paths.search(edition, r.suggestion) } : null;
    payload.titles = r.titles.map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      kind: c.type === "movie" ? "Movie" : "Series",
      href: paths.title(edition, c.type, c.slug),
      poster: imageUrl(c.posterPath, "w92"),
      service: c.services[0]?.name ?? null,
      dub: c.dub,
      sub: c.sub,
    }));
    payload.people = r.people.map((p) => ({
      name: p.name,
      href: paths.person(edition, p.slug),
      meta: ["Person", p.knownFor].filter(Boolean).join(" · "),
    }));
    payload.franchises = r.franchises.map((f) => ({
      name: `${f.name} — watch order`,
      href: paths.franchise(edition, f.slug),
      meta: `Franchise · ${f.count} ${f.count === 1 ? "title" : "titles"}`,
    }));
    payload.collections = r.collections.map((l) => ({
      name: l.name,
      href: paths.list(edition, l.slug),
      meta: `Collection · ${l.count} titles`,
    }));
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=300, stale-while-revalidate=600" },
  });
}
