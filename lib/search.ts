/**
 * Site search (PRD §7.2): trigram ranking over folded names — localized (edition language + English),
 * original titles and alt names; plus people, franchises and lists. Runs in TypeScript on D1 (ADR 0002).
 */
import { getCardsByIds, type TitleCard } from "./catalog";
import { db } from "./db";
import type { Edition } from "./editions";
import { computeShortAnswer, type AnswerOffer, type LangState } from "./short-answer";
import { transliterate } from "./slug";

export type AudioFilter = "dub" | "sub";

export const MAX_QUERY_LENGTH = 100;

// ───────────────────────── Query normalization (pure) ─────────────────────────

/**
 * Display / aggregate key: trimmed, single-spaced, Turkish-aware lowercase. Keeps Turkish letters
 * ("Vahşi Robot" → "vahşi robot") so trending searches read naturally. No personal data.
 */
export function normalizeQuery(input: string): string {
  return input
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr")
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

/**
 * Matching key (Turkish letters → Latin, lower, punctuation → space):
 * "Vahşi ROBOT" → "vahsi robot", "Ruhların Kaçışı" → "ruhlarin kacisi", "Nyong'o" → "nyongo".
 */
export function foldQuery(input: string): string {
  return transliterate(input.slice(0, MAX_QUERY_LENGTH * 2))
    .normalize("NFC") // recompose non-Latin scripts (e.g. Japanese dakuten) after NFKD
    .toLowerCase()
    .replace(/['’ʻ`]/g, "")
    .replace(/[\p{P}\p{S}\s]+/gu, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

/** Intent words that describe *how* to watch, not *what* ("arcane türkçe dublaj nerede izlenir"). */
const STOPWORDS = new Set([
  "turkce", "dublaj", "dublajli", "altyazi", "altyazili", "izle", "izlenir", "nerede", "hangi",
  "platformda", "platformunda", "var", "mi", "full", "hd", "film", "dizi", "where", "to", "watch",
  "stream", "online", "dub", "dubbed", "sub", "subbed", "subtitles",
]);
const DUB_WORDS = new Set(["dublaj", "dublajli", "dub", "dubbed"]);
const SUB_WORDS = new Set(["altyazi", "altyazili", "sub", "subbed", "subtitles"]);
const SEASON_RE = /\b(?:\d+\s*)?(?:sezon|season|bolum|episode|ep)(?:\s*\d+)?\b/g;

export type ParsedQuery = {
  /** Display / SearchStat key */
  display: string;
  /** Folded text used for matching (intent words removed when something else remains) */
  match: string;
  /** "türkçe dublaj" / "altyazı" mentioned in the query */
  audioHint: AudioFilter | null;
};

export function parseQuery(input: string): ParsedQuery {
  const display = normalizeQuery(input);
  const folded = foldQuery(display);
  const words = folded.split(" ").filter(Boolean);
  const audioHint = words.some((w) => DUB_WORDS.has(w)) ? "dub" : words.some((w) => SUB_WORDS.has(w)) ? "sub" : null;
  const core = folded.replace(SEASON_RE, " ").split(" ").filter((w) => w && !STOPWORDS.has(w)).join(" ");
  return { display, match: core || folded, audioHint };
}

/** Escapes LIKE wildcards in user input. */
export function likeEscape(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

export function parseAudio(v: unknown): AudioFilter | undefined {
  return v === "dub" || v === "sub" ? v : undefined;
}

// ───────────────────────── Trigram matching (pure) ─────────────────────────
// D1/SQLite has no pg_trgm/unaccent (ADR 0002): names are folded with foldQuery() and ranked with
// pg_trgm-style trigrams in TypeScript over a small per-isolate index (thousands of names).

/** pg_trgm trigrams: each word padded as "  word " and cut into 3-grams. */
export function trigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.split(/[^\p{L}\p{N}]+/u)) {
    if (!w) continue;
    const padded = `  ${w} `;
    for (let i = 0; i + 3 <= padded.length; i++) out.add(padded.slice(i, i + 3));
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

/** pg_trgm similarity(): shared trigrams / all trigrams. */
export function similarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  const common = overlap(A, B);
  return common / (A.size + B.size - common);
}

/** pg_trgm word_similarity() approximation: best similarity of `q` against any run of words in `text`. */
export function wordSimilarity(q: string, text: string): number {
  const Q = trigrams(q);
  if (Q.size === 0) return 0;
  const words = text.split(" ").filter(Boolean);
  const span = Math.max(1, q.split(" ").filter(Boolean).length + 1);
  let best = 0;
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= Math.min(words.length, i + span); j++) {
      const E = trigrams(words.slice(i, j).join(" "));
      const common = overlap(Q, E);
      best = Math.max(best, common / (Q.size + E.size - common));
      if (best === 1) return 1;
    }
  }
  return best;
}

/**
 * Relevance: exact (3) > prefix (2) > word prefix (1.5) > contains (1), then trigram
 * word_similarity + ½·similarity. Returns 0 when the name is not a candidate at all.
 */
export function scoreName(q: string, name: string, fuzzy = true): number {
  const ws = wordSimilarity(q, name);
  const sim = similarity(q, name);
  const tier = name === q ? 3 : name.startsWith(q) ? 2 : name.includes(` ${q}`) ? 1.5 : name.includes(q) ? 1 : 0;
  const candidate = tier > 0 || ws >= 0.6 || (fuzzy && sim >= 0.3);
  return candidate ? tier + ws + 0.5 * sim : 0;
}

const STRONG = 1.8; // ≥ contains (1) + decent similarity, or word_similarity ≈ 1 on a fuzzy hit

// ───────────────────────── Index (per isolate, short TTL) ─────────────────────────

type TitleEntry = { id: number; popularity: number; hasEditionName: boolean; names: string[]; editionName: string | null };
type NamedEntry<T> = T & { folded: string };
type SearchIndex = {
  titles: TitleEntry[];
  people: NamedEntry<PersonHit>[];
  franchises: NamedEntry<FranchiseHit>[];
  collections: NamedEntry<CollectionHit>[];
};

const INDEX_TTL_MS = 5 * 60_000;
const indexCache = new Map<string, { at: number; index: Promise<SearchIndex> }>();

async function buildIndex(e: Edition): Promise<SearchIndex> {
  const langs = [...new Set([e.contentLang, "en"])];
  const [titles, people, franchises, lists] = await Promise.all([
    db.title.findMany({
      select: { id: true, popularity: true, originalTitle: true, localizations: { where: { lang: { in: langs } }, select: { lang: true, name: true, altNames: true } } },
    }),
    db.person.findMany({ select: { id: true, name: true, slug: true, knownFor: true, credits: { select: { titleId: true } } } }),
    db.franchise.findMany({ select: { id: true, name: true, slug: true, _count: { select: { items: true } } } }),
    db.list.findMany({
      where: { lang: e.contentLang, countryCode: e.country, isPublished: true },
      select: { id: true, name: true, slug: true, _count: { select: { items: true } } },
    }),
  ]);
  return {
    titles: titles.map((t) => {
      const local = t.localizations.find((l) => l.lang === e.contentLang);
      return {
        id: t.id,
        popularity: t.popularity ?? 0,
        hasEditionName: !!local,
        editionName: local?.name ?? null,
        names: [...new Set([t.originalTitle, ...t.localizations.flatMap((l) => [l.name, ...l.altNames])].map(foldQuery).filter(Boolean))],
      };
    }),
    people: people.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, knownFor: p.knownFor, credits: new Set(p.credits.map((c) => c.titleId)).size, folded: foldQuery(p.name),
    })),
    franchises: franchises.map((f) => ({ id: f.id, name: f.name, slug: f.slug, count: f._count.items, folded: foldQuery(f.name) })),
    collections: lists.map((l) => ({ id: l.id, name: l.name, slug: l.slug, count: l._count.items, folded: foldQuery(l.name) })),
  };
}

function getIndex(e: Edition): Promise<SearchIndex> {
  const hit = indexCache.get(e.code);
  if (hit && Date.now() - hit.at < INDEX_TTL_MS) return hit.index;
  const index = buildIndex(e);
  index.catch(() => indexCache.delete(e.code));
  indexCache.set(e.code, { at: Date.now(), index });
  return index;
}

type TitleHitRow = { title_id: number; score: number };

/** Title ids with the edition language confirmed as audio (dub) or subtitles on an active offer. */
async function audioTitleIds(e: Edition, audio: AudioFilter): Promise<Set<number>> {
  const rows = await db.offer.findMany({
    where: {
      countryCode: e.country,
      isActive: true,
      languages: { some: { lang: e.contentLang, kind: audio === "dub" ? "audio" : "subtitle", status: "confirmed_yes" } },
    },
    select: { titleId: true },
  });
  return new Set(rows.map((r) => r.titleId));
}

async function searchTitleIds(e: Edition, q: string, limit: number, audio?: AudioFilter): Promise<TitleHitRow[]> {
  const [index, allowed] = await Promise.all([getIndex(e), audio ? audioTitleIds(e, audio) : null]);
  const hits: (TitleHitRow & { rank: number })[] = [];
  for (const t of index.titles) {
    if (!t.hasEditionName || (allowed && !allowed.has(t.id))) continue;
    const score = Math.max(...t.names.map((n) => scoreName(q, n)));
    if (score > 0) hits.push({ title_id: t.id, score, rank: score + 0.05 * Math.log(1 + Math.max(t.popularity, 0)) });
  }
  return hits
    .sort((a, b) => b.rank - a.rank || a.title_id - b.title_id)
    .slice(0, limit)
    .map(({ title_id, score }) => ({ title_id, score }));
}

/** Last resort for "Did you mean": closest edition-language name even below the candidate threshold. */
async function closestTitleName(e: Edition, q: string): Promise<string | null> {
  const index = await getIndex(e);
  let best: { name: string; score: number; popularity: number } | null = null;
  for (const t of index.titles) {
    if (!t.editionName) continue;
    const folded = foldQuery(t.editionName);
    const ws = wordSimilarity(q, folded);
    if (ws <= 0.3) continue;
    const score = ws + similarity(q, folded);
    if (!best || score > best.score || (score === best.score && t.popularity > best.popularity)) best = { name: t.editionName, score, popularity: t.popularity };
  }
  return best?.name ?? null;
}

export type PersonHit = { id: number; name: string; slug: string; knownFor: string | null; credits: number };
export type FranchiseHit = { id: number; name: string; slug: string; count: number };
export type CollectionHit = { id: number; name: string; slug: string; count: number };

function rankNamed<T extends { id: number }>(items: NamedEntry<T>[], q: string, limit: number): T[] {
  return items
    .map((it) => ({ it, score: scoreName(q, it.folded, false) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.it.id - b.it.id)
    .slice(0, limit)
    .map(({ it }) => {
      const rest: Partial<NamedEntry<T>> = { ...it };
      delete rest.folded;
      return rest as unknown as T;
    });
}

async function searchPeople(e: Edition, q: string, limit: number): Promise<PersonHit[]> {
  return rankNamed((await getIndex(e)).people, q, limit);
}

async function searchFranchises(e: Edition, q: string, limit: number): Promise<FranchiseHit[]> {
  return rankNamed((await getIndex(e)).franchises, q, limit);
}

async function searchCollections(e: Edition, q: string, limit: number): Promise<CollectionHit[]> {
  return rankNamed((await getIndex(e)).collections, q, limit);
}

// ───────────────────────── Public API ─────────────────────────

export type SearchOpts = {
  /** Max titles (default 24) */
  limit?: number;
  /** Max people / franchises / collections each (default 6) */
  groupLimit?: number;
  audio?: AudioFilter;
};

export type SearchResult = {
  /** Normalized display query (SearchStat key) */
  query: string;
  /** Folded text actually matched */
  match: string;
  titles: TitleCard[];
  /** Relevance per title id (debug / bench) */
  scores: Record<number, number>;
  people: PersonHit[];
  franchises: FranchiseHit[];
  collections: CollectionHit[];
  /** "Did you mean …" — set when nothing matched strongly */
  suggestion: string | null;
  /** At least one title matched literally / near-certainly */
  strong: boolean;
  audioHint: AudioFilter | null;
  total: number;
};

export async function searchAll(e: Edition, input: string, opts: SearchOpts = {}): Promise<SearchResult> {
  const { display, match, audioHint } = parseQuery(input);
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 60);
  const groupLimit = Math.min(Math.max(opts.groupLimit ?? 6, 0), 20);
  const empty: SearchResult = {
    query: display, match, titles: [], scores: {}, people: [], franchises: [], collections: [],
    suggestion: null, strong: false, audioHint, total: 0,
  };
  if (!match) return empty;

  const [hits, people, franchises, collections] = await Promise.all([
    searchTitleIds(e, match, limit, opts.audio),
    groupLimit ? searchPeople(e, match, groupLimit) : [],
    groupLimit ? searchFranchises(e, match, groupLimit) : [],
    groupLimit ? searchCollections(e, match, groupLimit) : [],
  ]);
  const titles = await getCardsByIds(e, hits.map((h) => h.title_id));
  const scores = Object.fromEntries(hits.map((h) => [h.title_id, h.score]));
  // Exact people / franchise / list hits also count — no "did you mean" for "hailee steinfeld".
  const strong = (hits[0]?.score ?? 0) >= STRONG || people.length + franchises.length + collections.length > 0;

  let suggestion: string | null = null;
  if (!strong) {
    suggestion = titles[0]?.name ?? (opts.audio ? null : await closestTitleName(e, match));
    if (suggestion && foldQuery(suggestion) === match) suggestion = null;
  }

  return {
    query: display, match, titles, scores, people, franchises, collections, suggestion, strong, audioHint,
    total: titles.length + people.length + franchises.length + collections.length,
  };
}

// ───────────────────────── SearchStat (aggregate, no personal data) ─────────────────────────

/** Today (UTC midnight) — the aggregate key's day. */
function today(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** +1 for (day, country, normalized query). Called once per submitted search, never per keystroke. */
export async function recordSearch(e: Edition, input: string, zeroResults: boolean): Promise<void> {
  const q = normalizeQuery(input);
  if (!q) return;
  const day = today();
  await db.searchStat.upsert({
    where: { day_countryCode_query: { day, countryCode: e.country, query: q } },
    create: { day, countryCode: e.country, query: q, count: 1, zeroResults },
    update: { count: { increment: 1 }, zeroResults },
  });
}

/** Top searches with results in the last `days` days (edition country). */
export async function getTrendingSearches(e: Edition, take = 6, days = 7): Promise<string[]> {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db.searchStat.groupBy({
    by: ["query"],
    where: { countryCode: e.country, zeroResults: false, day: { gte: since } },
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
    take,
  });
  return rows.map((r) => r.query);
}

// ───────────────────────── Top result CTA ─────────────────────────

/** Best way to watch the top result (dub first, cheapest) — reuses the short-answer rules. */
export async function getTopOffer(e: Edition, titleId: number) {
  const offers = await db.offer.findMany({
    where: { titleId, countryCode: e.country, isActive: true, seasonId: null },
    include: { service: true, languages: { where: { lang: e.contentLang } } },
  });
  const mapped: AnswerOffer[] = offers.map((o) => {
    const st = (kind: "audio" | "subtitle"): LangState => o.languages.find((l) => l.kind === kind)?.status ?? "unknown";
    return {
      serviceSlug: o.service.slug,
      serviceName: o.service.name,
      type: o.type,
      price: o.price ? Number(o.price) : null,
      currency: o.currency,
      url: o.url,
      audio: st("audio"),
      subtitle: st("subtitle"),
    };
  });
  const answer = computeShortAnswer(mapped);
  if (answer.kind === "none") return null;
  const checkedAt = offers[mapped.indexOf(answer.offer)]?.checkedAt ?? null;
  return { ...answer, checkedAt };
}
