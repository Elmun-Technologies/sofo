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

  const rows: { label: string; get: (c: (typeof cols)[number]) => LangState | undefined }[] = [
    { label: `${localLangName(editionLang)} dublaj`, get: (c) => c.audio[editionLang] },
    { label: `${localLangName(editionLang)} altyazı`, get: (c) => c.subtitle[editionLang] },
    ...(originalLang !== editionLang ? [{ label: `${langName(originalLang)} (original)`, get: (c: (typeof cols)[number]) => c.audio[originalLang] }] : []),
    ...[...others].map((l) => ({ label: `${langName(l)} subtitles`, get: (c: (typeof cols)[number]) => c.subtitle[l] })),
    { label: "4K / UHD", get: (c) => (c.uhd ? "confirmed_yes" : "confirmed_no") },
  ];

  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-text-2">
            <th scope="col" className="px-4 py-3 font-semibold">
              Language
            </th>
            {cols.map((c) => (
              <th key={c.name} scope="col" className="px-3 py-3 text-center font-semibold">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line-soft last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-bold">
                {r.label}
              </th>
              {cols.map((c) => (
                <td key={c.name} className="px-3 py-3 text-center">
                  <LangMark status={r.get(c)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line-soft px-4 py-2.5 text-xs text-text-3">
        ✓ confirmed by the service · — not offered · <span className="text-leaving">not confirmed</span> = the service hasn&apos;t told us yet. We never guess.
      </p>
    </div>
  );
}
