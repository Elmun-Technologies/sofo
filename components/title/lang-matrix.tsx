import { ChevronDownIcon } from "@/components/icons";
import { LangMark } from "@/components/ui/badges";
import { langName, localLangName } from "@/lib/lang";
import type { OfferView } from "@/lib/queries/title";
import type { LangState } from "@/lib/short-answer";

/** Audio & subtitle matrix: language × service. Only what the service confirms. */
export function LangMatrix({ offers, editionLang, originalLang }: { offers: OfferView[]; editionLang: string; originalLang: string }) {
  // One column per service (merge offer types: best status wins).
  const services = new Map<string, { name: string; audio: Record<string, LangState>; subtitle: Record<string, LangState>; uhd: boolean }>();
  const rank = (s?: LangState) => (s === "confirmed_yes" ? 2 : s === "confirmed_no" ? 1 : 0);
  for (const o of offers) {
    const cur = services.get(o.service.slug) ?? { name: o.service.name, audio: {}, subtitle: {}, uhd: false };
    for (const k of ["audio", "subtitle"] as const)
      for (const [l, s] of Object.entries(o[k])) if (rank(s) > rank(cur[k][l])) cur[k][l] = s;
    cur.uhd ||= o.quality === "uhd";
    services.set(o.service.slug, cur);
  }
  const cols = [...services.values()];
  if (cols.length === 0) return null;

  const others = new Set<string>();
  for (const c of cols) for (const l of [...Object.keys(c.audio), ...Object.keys(c.subtitle)]) if (l !== editionLang && l !== originalLang) others.add(l);

  type Col = (typeof cols)[number];
  type Row = { label: string; get: (c: Col) => LangState | undefined };
  // Key rows first (edition dub/subs, original audio, English); every other language goes in the fold.
  const keyRows: Row[] = [
    { label: `${localLangName(editionLang)} dublaj`, get: (c) => c.audio[editionLang] },
    { label: `${localLangName(editionLang)} altyazı`, get: (c) => c.subtitle[editionLang] },
    ...(originalLang !== editionLang ? [{ label: `${langName(originalLang)} (original audio)`, get: (c: Col) => c.audio[originalLang] }] : []),
    ...(originalLang !== "en" && editionLang !== "en" && others.has("en") ? [{ label: "English subtitles", get: (c: Col) => c.subtitle.en }] : []),
    { label: "4K / UHD", get: (c) => (c.uhd ? "confirmed_yes" : "confirmed_no") },
  ];
  others.delete("en");
  const restRows: Row[] = [...others]
    .map((l) => {
      const dub = cols.some((c) => c.audio[l] === "confirmed_yes");
      return { l, name: langName(l), dub };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .flatMap(({ l, name, dub }) => [
      ...(dub ? [{ label: `${name} audio`, get: (c: Col) => c.audio[l] }] : []),
      { label: `${name} subtitles`, get: (c: Col) => c.subtitle[l] },
    ]);

  const table = (rows: Row[], head: boolean) => (
    <table className="w-full min-w-[340px] text-sm">
      {head ? (
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-text-3">
            <th scope="col" className="px-5 py-3 font-semibold">
              Language
            </th>
            {cols.map((c) => (
              <th key={c.name} scope="col" className="w-28 px-3 py-3 text-center font-semibold text-text-2">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-hairline transition-colors last:border-0 hover:bg-white/[0.025]">
            <th scope="row" className="px-5 py-3 text-left font-semibold">
              {r.label}
            </th>
            {cols.map((c) => (
              <td key={c.name} className="w-28 px-3 py-2.5 text-center align-middle">
                <LangMark status={r.get(c)} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="overflow-x-auto rounded-panel border border-hairline bg-surface">
      {table(keyRows, true)}
      {restRows.length ? (
        <details className="group border-t border-hairline">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold text-text-2 transition-colors hover:bg-white/[0.025] hover:text-text [&::-webkit-details-marker]:hidden">
            <span>
              All languages <span className="font-normal text-text-3">· {others.size} more</span>
            </span>
            <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-text-3 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-hairline">{table(restRows, false)}</div>
        </details>
      ) : null}
      <p className="border-t border-hairline bg-white/[0.02] px-5 py-3 text-xs text-text-3">
        <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-available" />
            confirmed by the service
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-px w-2.5 bg-text-3" />
            not offered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-leaving" />
            <span className="text-leaving">not confirmed</span> — the service hasn&apos;t told us yet. We never guess.
          </span>
        </span>
      </p>
    </div>
  );
}
