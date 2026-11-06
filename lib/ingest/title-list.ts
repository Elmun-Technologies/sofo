/**
 * Title list input (`data/titles.csv`): one `tmdb_id,type` per line, `#` comments allowed.
 * Type is required — a wrong guess would link the availability of another show.
 */
export type TitleListRow = { tmdbId: number; type: "movie" | "tv" };

export function parseTitleCsv(csv: string): TitleListRow[] {
  const rows: TitleListRow[] = [];
  const seen = new Set<string>();

  csv.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#") || /^tmdb_id/i.test(line)) return;

    const [idRaw = "", typeRaw = ""] = line.split(",").map((part) => part.trim());
    const tmdbId = Number(idRaw);
    const type = typeRaw.toLowerCase();
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) throw new Error(`titles.csv:${index + 1}: invalid tmdb_id "${idRaw}"`);
    if (type !== "movie" && type !== "tv") throw new Error(`titles.csv:${index + 1}: type must be "movie" or "tv"`);

    const key = `${tmdbId}:${type}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ tmdbId, type });
  });

  return rows;
}
