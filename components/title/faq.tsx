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
    <div className="space-y-2.5">
      {items.map((f, i) => (
        <details key={f.q} open={i === 0} className="group rounded-card border border-line bg-surface px-4 py-3.5">
          <summary className="cursor-pointer list-none text-[15px] font-extrabold marker:hidden">
            <span className="mr-2 inline-block transition group-open:rotate-90">▸</span>
            {f.q}
          </summary>
          <p className="mt-2 text-sm text-text-2">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
