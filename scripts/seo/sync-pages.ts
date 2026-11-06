/**
 * Sync the Page table with the computed inventory (lib/seo/pages.ts).
 * Upserts every URL (indexStatus, qualityNote, hreflangKey, lastBuiltAt) and deletes rows
 * of live editions whose URL no longer exists.
 *
 *   pnpm exec dotenv -e .env.local -- tsx scripts/seo/sync-pages.ts [--dry-run]
 */
import { db } from "../../lib/db";
import { EDITIONS } from "../../lib/editions";
import { getPageInventory, summarizeInventory } from "../../lib/seo/pages";
import { withNodeDb } from "../../lib/db-node";

const CHUNK = 200;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const now = new Date();

  for (const e of Object.values(EDITIONS)) {
    const pages = await getPageInventory(e, now);
    const s = summarizeInventory(pages);
    console.log(`[${e.code}] ${s.total} pages · ${s.index} index · ${s.noindex} noindex`);
    for (const [reason, n] of Object.entries(s.reasons)) console.log(`   noindex ${String(n).padStart(4)} × ${reason}`);
    if (dryRun) continue;

    for (let i = 0; i < pages.length; i += CHUNK) {
      await db.$transaction(
        pages.slice(i, i + CHUNK).map((p) => {
          const fields = {
            type: p.type,
            lang: p.lang,
            countryCode: p.countryCode,
            entityId: p.entityId,
            indexStatus: p.index ? ("index" as const) : ("noindex" as const),
            qualityNote: p.reasons.length ? p.reasons.join("; ") : null,
            hreflangKey: p.hreflangKey,
            lastBuiltAt: now,
          };
          return db.page.upsert({ where: { path: p.path }, create: { path: p.path, ...fields }, update: fields });
        }),
      );
    }

    const removed = await db.page.deleteMany({
      where: { countryCode: e.country, lang: e.contentLang, path: { notIn: pages.map((p) => p.path) } },
    });
    console.log(`[${e.code}] upserted ${pages.length}, removed ${removed.count} stale`);
  }
}

withNodeDb(main)
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
