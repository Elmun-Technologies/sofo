import Link from "next/link";
import { paths, type Edition } from "@/lib/editions";
import { formatDate } from "@/lib/format";
import { dubTerm } from "@/lib/lang";
import type { TitlePageData } from "@/lib/queries/title";

/** Series: season tabs (link to season pages) + episodes of the newest season with episodes. */
export function Seasons({ data, edition }: { data: TitlePageData; edition: Edition }) {
  const seasons = data.title.seasons;
  if (seasons.length === 0) return null;
  const lang = edition.contentLang;
  const dubStatus = (s: (typeof seasons)[number]) => {
    const st = s.offers.flatMap((o) => o.languages.filter((l) => l.kind === "audio" && l.lang === lang).map((l) => l.status));
    return st.includes("confirmed_yes") ? "yes" : st.includes("confirmed_no") ? "no" : "unknown";
  };
  const shown = [...seasons].reverse().find((s) => s.episodes.length > 0);

  return (
    <div>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
        {seasons.map((s) => {
          const d = dubStatus(s);
          return (
            <li key={s.id}>
              <Link
                href={paths.season(edition, data.local.slug, s.number)}
                className="flex h-auto flex-col rounded-card border border-line bg-surface px-4 py-2.5 hover:border-orange hover:text-text"
              >
                <span className="text-sm font-extrabold">Season {s.number}</span>
                <span className={`text-xs ${d === "yes" ? "text-dub" : d === "no" ? "text-text-3" : "text-leaving"}`}>
                  {d === "yes" ? dubTerm(lang) : d === "no" ? "no dub" : "dub not confirmed"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {shown ? (
        <div className="mt-4">
          <p className="mb-2 text-sm text-text-2">
            Season {shown.number} · {shown.episodes.length} episodes
          </p>
          <ol className="grid gap-2 md:grid-cols-2">
            {shown.episodes.slice(0, 6).map((ep) => (
              <li key={ep.id} className="flex items-center gap-3 rounded-card bg-surface px-4 py-3">
                <span className="w-10 shrink-0 text-xs font-bold text-text-3">E{ep.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{ep.name}</span>
                  <span className="text-xs text-text-3">
                    {ep.airDate ? formatDate(ep.airDate) : ""} {ep.runtimeMin ? `· ${ep.runtimeMin}m` : ""}
                  </span>
                </span>
                {ep.tmdbScore ? <span className="text-xs font-bold text-available">{Number(ep.tmdbScore).toFixed(1)}</span> : null}
              </li>
            ))}
          </ol>
          <Link href={paths.season(edition, data.local.slug, shown.number)} className="mt-3 inline-block text-sm font-bold text-text-2">
            All episodes of season {shown.number} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
