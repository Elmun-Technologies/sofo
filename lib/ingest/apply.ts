/**
 * Ingest writers — the only place that touches Offer / AvailabilityEvent / metadata tables.
 * Diff semantics live in ./diff.ts (pure); this file only persists the plan.
 */
import { Prisma, type LangKind, type LangStatus } from "@prisma/client";
import { db, toList, type Db } from "../db";
import { slugify } from "../slug";
import { planDiff, planStats, type CurrentOfferState, type DiffPlan } from "./diff";
import type { TitleMetadata } from "./metadata";
import type { SnapshotOffer, SnapshotTitle } from "./normalize";

type Tx = Db;

export type AvailabilityIngestResult = {
  titleId: number | null;
  created: number;
  updated: number;
  deactivated: number;
  unchanged: number;
  events: number;
  note?: string;
  /** Present on --dry-run */
  plan?: DiffPlan;
};

export type MetadataIngestResult = {
  titleId: number;
  created: boolean;
  localizations: number;
  seasons: number;
  videos: number;
  franchise: string | null;
};

const offerFields = (offer: SnapshotOffer, serviceId: number, now: Date) => ({
  countryCode: offer.countryCode,
  serviceId,
  type: offer.type,
  quality: offer.quality,
  price: offer.price,
  currency: offer.currency,
  url: offer.url,
  leavingAt: offer.leavingAt,
  source: "streaming_availability",
  checkedAt: now,
});

const languageRows = (offer: SnapshotOffer) => [
  ...offer.audio.map((l) => ({ lang: l.lang, kind: "audio" as LangKind, status: l.status })),
  ...offer.subtitle.map((l) => ({ lang: l.lang, kind: "subtitle" as LangKind, status: l.status })),
];

const langMap = (rows: { lang: string; kind: LangKind; status: LangStatus }[], kind: LangKind): Record<string, LangStatus> => {
  const map: Record<string, LangStatus> = {};
  for (const row of rows) if (row.kind === kind) map[row.lang] = row.status;
  return map;
};

async function loadServiceMaps(): Promise<{ idBySlug: Map<string, number>; slugById: Map<number, string> }> {
  const services = await db.service.findMany({ select: { id: true, slug: true } });
  return {
    idBySlug: new Map(services.map((s) => [s.slug, s.id])),
    slugById: new Map(services.map((s) => [s.id, s.slug])),
  };
}

/**
 * Snapshot → Offer/OfferLanguage/AvailabilityEvent for one title and country.
 * Idempotent: the same snapshot twice produces no creates/updates/events, only a checkedAt refresh.
 */
export async function ingestTitleAvailability(snapshot: SnapshotTitle, opts: { now?: Date; dryRun?: boolean } = {}): Promise<AvailabilityIngestResult> {
  const now = opts.now ?? new Date();
  const title = await db.title.findUnique({
    where: { tmdbId_type: { tmdbId: snapshot.tmdbId, type: snapshot.type } },
    select: { id: true },
  });
  if (!title) return { titleId: null, created: 0, updated: 0, deactivated: 0, unchanged: 0, events: 0, note: "title not in DB — run ingest:metadata first" };

  const services = await loadServiceMaps();
  const rows = await db.offer.findMany({
    where: { titleId: title.id, countryCode: snapshot.countryCode, isActive: true, seasonId: null, episodeId: null },
    include: { languages: true },
  });
  const current: CurrentOfferState[] = rows.map((row) => ({
    id: row.id,
    serviceSlug: services.slugById.get(row.serviceId) ?? `service-${row.serviceId}`,
    type: row.type,
    quality: row.quality,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    url: row.url,
    leavingAt: row.leavingAt,
    audio: langMap(row.languages, "audio"),
    subtitle: langMap(row.languages, "subtitle"),
  }));

  const plan = planDiff(current, snapshot.offers);
  const stats = planStats(plan, current.length);
  const result: AvailabilityIngestResult = { titleId: title.id, ...stats };
  if (opts.dryRun) return { ...result, plan };
  if (plan.creates.length + plan.updates.length + plan.deactivates.length + plan.events.length === 0) {
    if (current.length) await db.offer.updateMany({ where: { id: { in: current.map((c) => c.id) } }, data: { checkedAt: now } });
    return result;
  }

  const changedIds = new Set(plan.updates.map((u) => u.current.id));
  const deactivatedIds = new Set(plan.deactivates.map((d) => d.id));
  const unchangedIds = current.filter((c) => !changedIds.has(c.id) && !deactivatedIds.has(c.id)).map((c) => c.id);

  // D1 has no interactive transactions (ADR 0002): writes run in order; the next run re-diffs anything left half-done.
  await (async (tx: Db) => {
      for (const next of plan.creates) {
        const serviceId = services.idBySlug.get(next.serviceSlug);
        if (!serviceId) throw new Error(`Service "${next.serviceSlug}" is not seeded — run pnpm db:seed`);
        await tx.offer.create({
          data: { titleId: title.id, ...offerFields(next, serviceId, now), languages: { create: languageRows(next) } },
        });
      }
      for (const { current: cur, next } of plan.updates) {
        await tx.offer.update({
          where: { id: cur.id },
          data: {
            quality: next.quality,
            price: next.price,
            currency: next.currency,
            url: next.url,
            leavingAt: next.leavingAt,
            checkedAt: now,
            languages: { deleteMany: {}, create: languageRows(next) },
          },
        });
      }
      for (const cur of plan.deactivates) {
        await tx.offer.update({ where: { id: cur.id }, data: { isActive: false, checkedAt: now } });
      }
      if (unchangedIds.length) {
        await tx.offer.updateMany({ where: { id: { in: unchangedIds } }, data: { checkedAt: now } });
      }

      const events = plan.events.flatMap((event) => {
        const serviceId = services.idBySlug.get(event.serviceSlug);
        if (!serviceId) return [];
        return [
          {
            titleId: title.id,
            countryCode: snapshot.countryCode,
            serviceId,
            type: event.type,
            offerType: event.offerType,
            before: event.before ? (event.before as Prisma.InputJsonValue) : undefined,
            after: event.after ? (event.after as Prisma.InputJsonValue) : undefined,
          },
        ];
      });
      if (events.length) await tx.availabilityEvent.createMany({ data: events });
  })(db);

  return result;
}

// ───────────────────────── Metadata ─────────────────────────

async function uniqueLocalizationSlug(tx: Tx, lang: string, desired: string, titleId: number, tmdbId: number): Promise<string> {
  let slug = desired;
  for (let n = 1; ; n++) {
    const existing = await tx.titleLocalization.findUnique({ where: { lang_slug: { lang, slug } }, select: { titleId: true } });
    if (!existing || existing.titleId === titleId) return slug;
    slug = n === 1 ? `${desired}-${tmdbId}` : `${desired}-${tmdbId}-${n}`;
  }
}

async function uniqueFranchiseSlug(tx: Tx, desired: string, collectionId: number): Promise<string> {
  let slug = desired;
  for (let n = 1; ; n++) {
    const existing = await tx.franchise.findUnique({ where: { slug }, select: { tmdbCollectionId: true } });
    if (!existing || existing.tmdbCollectionId === collectionId) return slug;
    slug = n === 1 ? `${desired}-${collectionId}` : `${desired}-${collectionId}-${n}`;
  }
}

/** Watch order: release order by year, ties broken by title id. */
async function reorderFranchise(tx: Tx, franchiseId: number): Promise<void> {
  const items = await tx.franchiseItem.findMany({
    where: { franchiseId },
    include: { title: { select: { id: true, year: true } } },
  });
  const ordered = items.sort((a, b) => (a.title.year ?? 9999) - (b.title.year ?? 9999) || a.title.id - b.title.id);
  for (const [index, item] of ordered.entries()) {
    const releaseOrder = index + 1;
    if (item.releaseOrder !== releaseOrder) await tx.franchiseItem.update({ where: { id: item.id }, data: { releaseOrder } });
  }
}

/** TMDB metadata → Title, TitleLocalization (tr/en), Season, official Video, Franchise. */
export async function upsertTitleMetadata(meta: TitleMetadata, opts: { dryRun?: boolean } = {}): Promise<MetadataIngestResult> {
  if (opts.dryRun) {
    return {
      titleId: 0,
      created: false,
      localizations: meta.localizations.length,
      seasons: meta.seasons.length,
      videos: meta.videos.length,
      franchise: meta.collection?.name ?? null,
    };
  }

  // D1 has no interactive transactions (ADR 0002): writes run in order and are idempotent upserts.
  return (async (tx: Db) => {
      const core = {
        originalTitle: meta.originalTitle,
        originalLang: meta.originalLang,
        year: meta.year,
        runtimeMin: meta.runtimeMin,
        tmdbScore: meta.tmdbScore,
        popularity: meta.popularity,
        posterPath: meta.posterPath,
        backdropPath: meta.backdropPath,
        genres: toList(meta.genres),
        isAnimation: meta.isAnimation,
        isKids: meta.isKids,
      };
      const existing = await tx.title.findUnique({
        where: { tmdbId_type: { tmdbId: meta.tmdbId, type: meta.type } },
        select: { id: true },
      });
      const title = existing
        ? await tx.title.update({ where: { id: existing.id }, data: core })
        : await tx.title.create({ data: { tmdbId: meta.tmdbId, type: meta.type, ...core } });

      for (const loc of meta.localizations) {
        const desired = slugify(loc.name) || `${meta.type}-${meta.tmdbId}`;
        const slug = await uniqueLocalizationSlug(tx, loc.lang, desired, title.id, meta.tmdbId);
        await tx.titleLocalization.upsert({
          where: { titleId_lang: { titleId: title.id, lang: loc.lang } },
          create: { titleId: title.id, lang: loc.lang, name: loc.name, altNames: toList(loc.altNames), overview: loc.overview, slug },
          update: { name: loc.name, altNames: toList(loc.altNames), overview: loc.overview, slug },
        });
      }

      for (const season of meta.seasons) {
        const data = {
          name: season.name,
          airDate: season.airDate,
          episodeCount: season.episodeCount,
          tmdbScore: season.tmdbScore,
          posterPath: season.posterPath,
        };
        await tx.season.upsert({
          where: { titleId_number: { titleId: title.id, number: season.number } },
          create: { titleId: title.id, number: season.number, ...data },
          update: data,
        });
      }

      for (const video of meta.videos) {
        const data = {
          titleId: title.id,
          name: video.name,
          kind: video.kind,
          lang: video.lang,
          isOfficial: video.isOfficial,
          publishedAt: video.publishedAt,
        };
        await tx.video.upsert({
          where: { site_key: { site: "youtube", key: video.key } },
          create: { site: "youtube", key: video.key, ...data },
          update: data,
        });
      }

      let franchiseName: string | null = null;
      if (meta.collection) {
        const collection = meta.collection;
        const slug = await uniqueFranchiseSlug(tx, slugify(collection.name) || `collection-${collection.tmdbId}`, collection.tmdbId);
        const franchise = await tx.franchise.upsert({
          where: { tmdbCollectionId: collection.tmdbId },
          create: { tmdbCollectionId: collection.tmdbId, name: collection.name, slug },
          update: { name: collection.name },
        });
        await tx.franchiseItem.upsert({
          where: { franchiseId_titleId: { franchiseId: franchise.id, titleId: title.id } },
          create: { franchiseId: franchise.id, titleId: title.id, releaseOrder: meta.year ?? 0 },
          update: { releaseOrder: meta.year ?? 0 },
        });
        await tx.title.update({ where: { id: title.id }, data: { franchiseId: franchise.id } });
        await reorderFranchise(tx, franchise.id);
        franchiseName = collection.name;
      }

      return {
        titleId: title.id,
        created: !existing,
        localizations: meta.localizations.length,
        seasons: meta.seasons.length,
        videos: meta.videos.length,
        franchise: franchiseName,
      };
  })(db);
}
