import { cache } from "react";
import { availableWhere } from "../catalog";
import { db } from "../db";
import type { Edition } from "../editions";
import { slugify } from "../slug";

export type MenuGenre = { slug: string; name: string; count: number; posterPath: string | null };
export type MegaMenuData = { movie: MenuGenre[]; tv: MenuGenre[]; total: { movie: number; tv: number } };

/**
 * Catalogue mega-menu (santehnika "Каталог"): genres per type with a count and one representative poster
 * (the most popular title of that genre not already used by a bigger genre). One query per render.
 */
export const getMegaMenu = cache(async (e: Edition): Promise<MegaMenuData> => {
  const rows = await db.title.findMany({
    where: { ...availableWhere(e), localizations: { some: { lang: e.contentLang } } },
    select: { type: true, genres: true, posterPath: true },
    orderBy: [{ popularity: { sort: "desc", nulls: "last" } }, { id: "asc" }],
  });
  const build = (type: "movie" | "tv"): MenuGenre[] => {
    const list = rows.filter((r) => r.type === type);
    const counts = new Map<string, number>();
    for (const r of list) for (const g of r.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    const used = new Set<string>();
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => {
        const pick = list.find((r) => r.genres.includes(name) && r.posterPath && !used.has(r.posterPath)) ?? list.find((r) => r.genres.includes(name));
        if (pick?.posterPath) used.add(pick.posterPath);
        return { slug: slugify(name), name, count, posterPath: pick?.posterPath ?? null };
      });
  };
  return {
    movie: build("movie"),
    tv: build("tv"),
    total: { movie: rows.filter((r) => r.type === "movie").length, tv: rows.filter((r) => r.type === "tv").length },
  };
});
