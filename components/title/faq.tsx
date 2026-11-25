import type { Edition } from "@/lib/editions";
import { formatPrice } from "@/lib/format";
import { langName } from "@/lib/lang";
import type { TitlePageData } from "@/lib/queries/title";

export type FaqItem = { q: string; a: string };

/** Three FAQ answers generated from data (facts only, no free-form AI text). */
export function buildFaq(data: TitlePageData, edition: Edition): FaqItem[] {
  const { local, offers } = data;
  const lang = edition.contentLang;
  const L = langName(lang);
  const where = edition.countryName;
  const stream = offers.filter((o) => o.type === "subscription" || o.type === "free" || o.type === "ads");
  const paid = offers.filter((o) => o.type === "rent" || o.type === "buy");
  const names = (xs: typeof offers) => [...new Set(xs.map((o) => o.service.name))].join(", ");
  const dub = offers.filter((o) => o.audio[lang] === "confirmed_yes");
  const sub = offers.filter((o) => o.subtitle[lang] === "confirmed_yes");
  const free = offers.filter((o) => o.type === "free" || o.type === "ads");
  const cheapestPaid = [...paid].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];

  return [
    {
      q: `Where can I watch ${local.name} in ${where}?`,
      a: stream.length
        ? `${local.name} streams on ${names(stream)} in ${where}${paid.length ? `, and you can rent or buy it on ${names(paid)}` : ""}.`
        : paid.length
          ? `It isn't included in any subscription in ${where}. You can rent or buy it on ${names(paid)}.`
          : `${local.name} isn't legally available in ${where} right now. Follow it and we'll tell you when it arrives.`,
    },
    {
      q: `Can I watch ${local.name} with ${L} dub (${lang === "tr" ? "türkçe dublaj" : `${L} audio`})?`,
      a: dub.length
        ? `Yes. ${names(dub)} confirm${dub.length === 1 ? "s" : ""} ${L} audio.${sub.length ? ` ${L} subtitles: ${names(sub)}.` : ""}`
        : sub.length
          ? `Not confirmed. ${names(sub)} offer${sub.length === 1 ? "s" : ""} ${L} subtitles; no service confirms ${L} audio yet.`
          : `No service in ${where} confirms ${L} audio or subtitles yet.`,
    },
    {
      q: `Is ${local.name} free anywhere?`,
      a: free.length
        ? `Yes — free with ads on ${names(free)}.`
        : `No. ${stream.length ? `It needs a subscription (${names(stream)})` : "There is no subscription option"}${cheapestPaid ? `; renting starts at ${formatPrice(cheapestPaid.price, cheapestPaid.currency)}` : ""}.`,
    },
  ];
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-hairline overflow-hidden rounded-panel border border-hairline bg-surface">
      {items.map((f, i) => (
        <details key={f.q} open={i === 0} className="group">
          <summary className="flex items-center gap-4 px-5 py-4 text-[15px] font-semibold transition-colors hover:bg-text/[0.03]">
            <span className="flex-1">{f.q}</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-3 transition-transform duration-200 group-open:rotate-180">
              <path d="m5 9 7 7 7-7" />
            </svg>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-text-2">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
