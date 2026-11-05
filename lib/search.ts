/**
 * Site search (PRD §7.2, data-model.md §6): pg_trgm + sofo_unaccent() over localized names
 * (edition language + English), original titles and alt names; plus people, franchises and lists.
 * Every name expression goes through sofo_unaccent(...) so the GIN trigram indexes can be used.
 */
import { Prisma } from "@prisma/client";
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
 * Matching key, mirrors the SQL side (sofo_unaccent + lower + punctuation → space):
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

// ───────────────────────── SQL ─────────────────────────

/** Name as compared in SQL: unaccented, lowercase, apostrophes dropped, punctuation → space. */
const norm = (col: Prisma.Sql) =>
  Prisma.sql`btrim(regexp_replace(regexp_replace(lower(sofo_unaccent(${col})), '[''’ʻ]', '', 'g'), '[[:punct:][:space:]]+', ' ', 'g'))`;

/** Index-friendly candidate predicate (ILIKE / <% / % are all GIN gin_trgm_ops operators). */
const matches = (col: Prisma.Sql, q: string, like: string, fuzzy: boolean) =>
  fuzzy
    ? Prisma.sql`(sofo_unaccent(${col}) ILIKE ${like} OR ${q} <% sofo_unaccent(${col}) OR sofo_unaccent(${col}) % ${q})`
    : Prisma.sql`(sofo_unaccent(${col}) ILIKE ${like} OR ${q} <% sofo_unaccent(${col}))`;

/**
 * Relevance: exact (3) > prefix (2) > word prefix (1.5) > contains (1), then trigram
 * word_similarity + ½·similarity. `strong` = a literal hit or a near-certain fuzzy one.
 */
const scoreSql = (n: Prisma.Sql, q: string, esc: string) => Prisma.sql`(
  CASE WHEN ${n} = ${q} THEN 3
       WHEN ${n} LIKE ${esc + "%"} THEN 2
       WHEN ${n} LIKE ${"% " + esc + "%"} THEN 1.5
       WHEN ${n} LIKE ${"%" + esc + "%"} THEN 1
       ELSE 0 END
  + word_similarity(${q}, ${n}) + 0.5 * similarity(${q}, ${n}))`;

const STRONG = 1.8; // ≥ contains (1) + decent similarity, or word_similarity ≈ 1 on a fuzzy hit

type TitleHitRow = { title_id: number; score: number };

function audioSql(e: Edition, audio: AudioFilter | undefined): Prisma.Sql {
  if (!audio) return Prisma.empty;
  const kind = audio === "dub" ? "audio" : "subtitle";
  return Prisma.sql`AND EXISTS (
    SELECT 1 FROM offer o JOIN offer_language ol ON ol.offer_id = o.id
    WHERE o.title_id = t.id AND o.country_code = ${e.country} AND o.is_active
      AND ol.lang = ${e.contentLang} AND ol.kind = ${kind}::"LangKind" AND ol.status = 'confirmed_yes')`;
}

async function searchTitleIds(e: Edition, q: string, limit: number, audio?: AudioFilter): Promise<TitleHitRow[]> {
  const esc = likeEscape(q);
  const like = `%${esc}%`;
  const langs = [...new Set([e.contentLang, "en"])];
  const n = Prisma.sql`n`;
  return db.$queryRaw<TitleHitRow[]>`
    WITH cand AS (
      SELECT l.title_id, l.name AS n FROM title_localization l
       WHERE l.lang = ANY(${langs}) AND ${matches(Prisma.sql`l.name`, q, like, true)}
      UNION ALL
      SELECT t.id, t.original_title FROM title t
       WHERE ${matches(Prisma.sql`t.original_title`, q, like, true)}
      UNION ALL
      SELECT l.title_id, a FROM title_localization l, unnest(l.alt_names) a
       WHERE l.lang = ANY(${langs})
         -- index prefilter (title_loc_alt_names_trgm), then per-name match
         AND (sofo_alt_names(l.alt_names) ILIKE ${like} OR ${q} <% sofo_alt_names(l.alt_names) OR sofo_alt_names(l.alt_names) % ${q})
         AND ${matches(Prisma.sql`a`, q, like, true)}
    ), scored AS (
      SELECT title_id, max(${scoreSql(norm(n), q, esc)})::float8 AS score FROM cand GROUP BY title_id
    )
    SELECT s.title_id, s.score FROM scored s JOIN title t ON t.id = s.title_id
     WHERE EXISTS (SELECT 1 FROM title_localization l WHERE l.title_id = t.id AND l.lang = ${e.contentLang})
     ${audioSql(e, audio)}
     ORDER BY s.score + 0.05 * ln(1 + greatest(coalesce(t.popularity, 0), 0)) DESC, t.id
     LIMIT ${limit}`;
}

/** Last resort for "Did you mean": closest localized name even below the trigram threshold. */
async function closestTitleName(e: Edition, q: string): Promise<string | null> {
  const rows = await db.$queryRaw<{ name: string }[]>`
    SELECT l.name FROM title_localization l JOIN title t ON t.id = l.title_id
     WHERE l.lang = ${e.contentLang} AND word_similarity(${q}, sofo_unaccent(l.name)) > 0.3
     ORDER BY word_similarity(${q}, sofo_unaccent(l.name)) + similarity(${q}, sofo_unaccent(l.name)) DESC, t.popularity DESC NULLS LAST
     LIMIT 1`;
  return rows[0]?.name ?? null;
}

export type PersonHit = { id: number; name: string; slug: string; knownFor: string | null; credits: number };
export type FranchiseHit = { id: number; name: string; slug: string; count: number };
export type CollectionHit = { id: number; name: string; slug: string; count: number };

async function searchPeople(q: string, limit: number): Promise<PersonHit[]> {
  const esc = likeEscape(q);
  return db.$queryRaw<PersonHit[]>`
    SELECT p.id, p.name, p.slug, p.known_for AS "knownFor",
           (SELECT count(DISTINCT c.title_id)::int FROM credit c WHERE c.person_id = p.id) AS credits
      FROM person p
     WHERE ${matches(Prisma.sql`p.name`, q, `%${esc}%`, false)}
     ORDER BY ${scoreSql(norm(Prisma.sql`p.name`), q, esc)} DESC, p.id
     LIMIT ${limit}`;
}

async function searchFranchises(q: string, limit: number): Promise<FranchiseHit[]> {
  const esc = likeEscape(q);
  return db.$queryRaw<FranchiseHit[]>`
    SELECT f.id, f.name, f.slug, (SELECT count(*)::int FROM franchise_item i WHERE i.franchise_id = f.id) AS count
      FROM franchise f
     WHERE ${matches(Prisma.sql`f.name`, q, `%${esc}%`, false)}
     ORDER BY ${scoreSql(norm(Prisma.sql`f.name`), q, esc)} DESC, f.id
     LIMIT ${limit}`;
}

async function searchCollections(e: Edition, q: string, limit: number): Promise<CollectionHit[]> {
  const esc = likeEscape(q);
  return db.$queryRaw<CollectionHit[]>`
    SELECT li.id, li.name, li.slug, (SELECT count(*)::int FROM list_item i WHERE i.list_id = li.id) AS count
      FROM list li
     WHERE li.lang = ${e.contentLang} AND li.country_code = ${e.country} AND li.is_published
       AND ${matches(Prisma.sql`li.name`, q, `%${esc}%`, false)}
     ORDER BY ${scoreSql(norm(Prisma.sql`li.name`), q, esc)} DESC, li.id
     LIMIT ${limit}`;
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
    groupLimit ? searchPeople(match, groupLimit) : [],
    groupLimit ? searchFranchises(match, groupLimit) : [],
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

/** Today's date (UTC) as a DATE value for the aggregate key. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** +1 for (day, country, normalized query). Called once per submitted search, never per keystroke. */
export async function recordSearch(e: Edition, input: string, zeroResults: boolean): Promise<void> {
  const q = normalizeQuery(input);
  if (!q) return;
  await db.$executeRaw`
    INSERT INTO search_stat (day, country_code, query, count, zero_results)
    VALUES (${today()}::date, ${e.country}, ${q}, 1, ${zeroResults})
    ON CONFLICT (day, country_code, query)
    DO UPDATE SET count = search_stat.count + 1, zero_results = EXCLUDED.zero_results`;
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
