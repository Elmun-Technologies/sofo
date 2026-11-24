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
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {seasons.map((s) => {
          const d = dubStatus(s);
          return (
            <li key={s.id}>
              <Link
                href={paths.season(edition, data.local.slug, s.number)}
                className="card card-hover flex h-auto min-w-[132px] flex-col px-4 py-3"
              >
                <span className="text-sm font-bold whitespace-nowrap">Season {s.number}</span>
                <span className={`mt-0.5 text-xs whitespace-nowrap ${d === "yes" ? "text-[#8ab4ff]" : d === "no" ? "text-text-3" : "text-leaving"}`}>
                  {d === "yes" ? dubTerm(lang) : d === "no" ? "no dub" : "dub not confirmed"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {shown ? (
        <div className="mt-4">
          <p className="mb-3 text-sm text-text-3">
            Season {shown.number} · {shown.episodes.length} episodes
          </p>
          <ol className="divide-y divide-hairline overflow-hidden rounded-panel border border-hairline bg-surface">
            {shown.episodes.slice(0, 6).map((ep) => (
              <li key={ep.id} className="flex items-center gap-4 px-5 py-3">
                <span className="tnum w-7 shrink-0 text-sm font-bold text-text-3">{ep.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{ep.name}</span>
                  <span className="text-xs text-text-3">
                    {ep.airDate ? formatDate(ep.airDate) : ""} {ep.runtimeMin ? `· ${ep.runtimeMin}m` : ""}
                  </span>
                </span>
                {ep.tmdbScore ? <span className="tnum text-xs font-bold text-text-2">★ {Number(ep.tmdbScore).toFixed(1)}</span> : null}
              </li>
            ))}
          </ol>
          <Link href={paths.season(edition, data.local.slug, shown.number)} className="link mt-4 inline-block text-sm">
            All episodes of season {shown.number} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
