import { NextResponse, type NextRequest } from "next/server";
import type { SuggestCategory, SuggestPayload } from "@/components/search/types";
import { getServices } from "@/lib/catalog";
import { getEdition, paths, type Edition } from "@/lib/editions";
import { dubTerm, subTerm } from "@/lib/lang";
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

  const payload: SuggestPayload = { q, suggestion: null, titles: [], people: [], franchises: [], collections: [], categories: [], trending: [] };

  if (!q.trim()) {
    payload.trending = await getTrendingSearches(edition, 5);
  } else {
    const [r, categories] = await Promise.all([searchAll(edition, q, { limit, groupLimit: 2, audio: parseAudio(sp.get("audio")) }), matchCategories(edition, q)]);
    payload.categories = categories;
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
      meta: "Franchise",
    }));
    payload.collections = r.collections.map((l) => ({
      name: l.name,
      href: paths.list(edition, l.slug),
      meta: "Collection",
    }));
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=300, stale-while-revalidate=600" },
  });
}

/** Folds case and Turkish letters so "çocuk", "Cocuk" and "COCUK" match the same alias. */
const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();

/** Categories and platforms whose name or alias starts with the query (max 4). */
async function matchCategories(e: Edition, q: string): Promise<SuggestCategory[]> {
  const term = fold(q);
  if (term.length < 2) return [];
  const r = e.routes;
  const cats: (SuggestCategory & { aliases: string[] })[] = [
    { name: "Movies", href: r.movies, meta: "Category", aliases: ["movies", "movie", "film", "filmler", "kino"] },
    { name: "Series", href: r.series, meta: "Category", aliases: ["series", "tv", "dizi", "diziler", "serial"] },
    { name: "Anime", href: r.anime, meta: "Category", aliases: ["anime", "animasyon"] },
    { name: "Kids", href: r.kids, meta: "Category", aliases: ["kids", "children", "cocuk", "cizgi film", "multfilm"] },
    { name: dubTerm(e.contentLang), href: r.dubHub, meta: "Category", aliases: ["turkce dublaj", "dublaj", "dub", "dubbed"] },
    { name: subTerm(e.contentLang), href: r.subHub, meta: "Category", aliases: ["turkce altyazi", "altyazi", "subtitles", "sub"] },
    { name: "New & leaving", href: r.newLeaving, meta: "Category", aliases: ["new", "yeni", "leaving", "ayrilan", "son sans"] },
    { name: "Coming to digital", href: r.releases, meta: "Category", aliases: ["coming", "yakinda", "release", "vizyon"] },
    { name: "Trailers", href: r.trailers, meta: "Category", aliases: ["trailer", "fragman", "fragmanlar"] },
  ];
  const services = await getServices(e);
  for (const s of services) cats.push({ name: s.name, href: paths.service(e, s.slug), meta: "Platform", service: s.slug, aliases: [s.name, s.slug.replace(/-/g, " ")] });
  return cats
    .filter((c) => [c.name, ...c.aliases].some((a) => fold(a).startsWith(term) || (term.length >= 4 && fold(a).split(" ").some((w) => w.startsWith(term)))))
    .slice(0, 4)
    .map((c) => ({ name: c.name, href: c.href, meta: c.meta, service: c.service }));
}
