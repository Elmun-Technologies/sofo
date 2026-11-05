/**
 * Search acceptance bench (prompts/03-search.md): 50 queries against the seeded DB.
 * Prints hit rate and p50 / p95 latency of searchAll(). Target: p95 < 150 ms.
 *
 *   npx dotenv -e .env.local -- tsx scripts/search-bench.ts [--verbose]
 */
import { db } from "../lib/db";
import { getEdition } from "../lib/editions";
import { searchAll } from "../lib/search";

type Case = {
  q: string;
  kind: "exact" | "unaccented" | "typo" | "partial" | "person" | "franchise" | "collection" | "intent" | "original";
  /** Expected: title name (any localization) among the top 3, or a person / franchise / list name, or a suggestion. */
  expect: string;
  in?: "titles" | "people" | "franchises" | "collections" | "suggestion";
};

const CASES: Case[] = [
  // exact (localized TR names)
  { q: "Vahşi Robot", kind: "exact", expect: "Vahşi Robot" },
  { q: "Arcane", kind: "exact", expect: "Arcane" },
  { q: "Ters Yüz 2", kind: "exact", expect: "Ters Yüz 2" },
  { q: "Ruhların Kaçışı", kind: "exact", expect: "Ruhların Kaçışı" },
  { q: "Kung Fu Panda 4", kind: "exact", expect: "Kung Fu Panda 4" },
  { q: "Simpsonlar", kind: "exact", expect: "Simpsonlar" },
  { q: "Başlangıç", kind: "exact", expect: "Başlangıç" },
  { q: "Yıldızlararası", kind: "exact", expect: "Yıldızlararası" },
  // unaccented / ASCII-typed Turkish
  { q: "vahsi robot", kind: "unaccented", expect: "Vahşi Robot" },
  { q: "ruhlarin kacisi", kind: "unaccented", expect: "Ruhların Kaçışı" },
  { q: "ters yuz 2", kind: "unaccented", expect: "Ters Yüz 2" },
  { q: "baslangic", kind: "unaccented", expect: "Başlangıç" },
  { q: "yildizlararasi", kind: "unaccented", expect: "Yıldızlararası" },
  { q: "super mario kardesler", kind: "unaccented", expect: "Süper Mario Kardeşler Filmi" },
  { q: "orumcek adam", kind: "unaccented", expect: "Örümcek-Adam: Örümcek-Evrenine Geçiş" },
  { q: "VAHŞİ ROBOT", kind: "unaccented", expect: "Vahşi Robot" },
  // original / English titles
  { q: "the wild robot", kind: "original", expect: "Vahşi Robot" },
  { q: "inside out 2", kind: "original", expect: "Ters Yüz 2" },
  { q: "spirited away", kind: "original", expect: "Ruhların Kaçışı" },
  { q: "inception", kind: "original", expect: "Başlangıç" },
  { q: "the simpsons", kind: "original", expect: "Simpsonlar" },
  { q: "進撃の巨人", kind: "original", expect: "Attack on Titan" },
  // partial / prefix
  { q: "kung fu", kind: "partial", expect: "Kung Fu Panda 4" },
  { q: "vahsi", kind: "partial", expect: "Vahşi Robot" },
  { q: "demon sla", kind: "partial", expect: "Demon Slayer: Kimetsu no Yaiba" },
  { q: "stranger", kind: "partial", expect: "Stranger Things" },
  { q: "jujutsu", kind: "partial", expect: "Jujutsu Kaisen" },
  { q: "spider", kind: "partial", expect: "Örümcek-Adam: Örümcek-Evrenine Geçiş" },
  { q: "squid", kind: "partial", expect: "Squid Game" },
  { q: "breaking", kind: "partial", expect: "Breaking Bad" },
  // typos → result or "did you mean"
  { q: "arcan", kind: "typo", expect: "Arcane" },
  { q: "vahsi robto", kind: "typo", expect: "Vahşi Robot" },
  { q: "interstelar", kind: "typo", expect: "Yıldızlararası" },
  { q: "stranger thigns", kind: "typo", expect: "Stranger Things" },
  { q: "jujutsu kaysen", kind: "typo", expect: "Jujutsu Kaisen" },
  { q: "encantoo", kind: "typo", expect: "Encanto" },
  { q: "wensday", kind: "typo", expect: "Wednesday" },
  { q: "breking bad", kind: "typo", expect: "Breaking Bad" },
  // intent words
  { q: "arcane türkçe dublaj", kind: "intent", expect: "Arcane" },
  { q: "arcan 2 sezon", kind: "intent", expect: "Arcane" },
  { q: "vahşi robot nerede izlenir", kind: "intent", expect: "Vahşi Robot" },
  { q: "moana 2 türkçe dublaj izle", kind: "intent", expect: "Moana 2" },
  // people
  { q: "hailee steinfeld", kind: "person", expect: "Hailee Steinfeld", in: "people" },
  { q: "pedro pascal", kind: "person", expect: "Pedro Pascal", in: "people" },
  { q: "timothee chalamet", kind: "person", expect: "Timothée Chalamet", in: "people" },
  { q: "miyazaki", kind: "person", expect: "Hayao Miyazaki", in: "people" },
  { q: "christopher nolen", kind: "person", expect: "Christopher Nolan", in: "people" },
  // franchises / collections
  { q: "toy story", kind: "franchise", expect: "Toy Story", in: "franchises" },
  { q: "spider verse", kind: "franchise", expect: "Spider-Verse", in: "franchises" },
  { q: "pixar", kind: "collection", expect: "Pixar filmleri hangi platformda?", in: "collections" },
];

function pct(sorted: number[], p: number): number {
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, i)]!;
}

async function main() {
  const verbose = process.argv.includes("--verbose");
  const edition = getEdition("tr")!;
  // Names in every localization, so "Attack on Titan" etc. resolve to a title id.
  const locs = await db.titleLocalization.findMany({ select: { titleId: true, name: true } });
  const idsByName = new Map<string, Set<number>>();
  for (const l of locs) idsByName.set(l.name, (idsByName.get(l.name) ?? new Set()).add(l.titleId));

  await searchAll(edition, "warm up");

  const times: number[] = [];
  const misses: string[] = [];
  const byKind = new Map<string, { n: number; hit: number }>();

  for (const c of CASES) {
    const t0 = performance.now();
    const r = await searchAll(edition, c.q, { limit: 24 });
    const ms = performance.now() - t0;
    times.push(ms);

    let hit: boolean;
    let got: string;
    if (c.in === "people" || c.in === "franchises" || c.in === "collections") {
      const names = r[c.in].map((x) => x.name);
      hit = names.slice(0, 3).includes(c.expect);
      got = names.slice(0, 3).join(" | ");
    } else {
      const ids = idsByName.get(c.expect) ?? new Set<number>();
      hit = r.titles.slice(0, 3).some((t) => ids.has(t.id)) || (r.suggestion !== null && foldEq(r.suggestion, c.expect, idsByName));
      got = r.titles.slice(0, 3).map((t) => t.name).join(" | ") + (r.suggestion ? `  [did you mean: ${r.suggestion}]` : "");
    }
    const k = byKind.get(c.kind) ?? { n: 0, hit: 0 };
    k.n++;
    if (hit) k.hit++;
    byKind.set(c.kind, k);
    if (!hit) misses.push(`  ✗ [${c.kind}] "${c.q}" → expected "${c.expect}", got: ${got || "(nothing)"}`);
    if (verbose) console.log(`${hit ? "✓" : "✗"} ${ms.toFixed(1).padStart(6)} ms  "${c.q}" → ${got}`);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const hits = CASES.length - misses.length;
  console.log(`\nSearch bench — ${CASES.length} queries (edition tr)`);
  console.log(`Hit rate: ${hits}/${CASES.length} (${((hits / CASES.length) * 100).toFixed(0)}%)`);
  for (const [kind, k] of byKind) console.log(`  ${kind.padEnd(11)} ${k.hit}/${k.n}`);
  console.log(`Latency: p50 ${pct(sorted, 50).toFixed(1)} ms · p95 ${pct(sorted, 95).toFixed(1)} ms · max ${sorted.at(-1)!.toFixed(1)} ms`);
  console.log(pct(sorted, 95) < 150 ? "✓ p95 < 150 ms" : "✗ p95 ≥ 150 ms");
  if (misses.length) console.log(`\nMisses:\n${misses.join("\n")}`);
  await db.$disconnect();
  process.exitCode = pct(sorted, 95) < 150 && hits / CASES.length >= 0.9 ? 0 : 1;
}

/** Suggestion counts as a hit when it names the expected title (in any localization). */
function foldEq(suggestion: string, expect: string, idsByName: Map<string, Set<number>>): boolean {
  const a = idsByName.get(suggestion);
  const b = idsByName.get(expect);
  return !!a && !!b && [...a].some((id) => b.has(id));
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
