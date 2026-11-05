import { OutboundLink } from "@/components/outbound-link";
import { buttonClass } from "@/components/ui/button";
import { ServiceLogo } from "@/components/ui/service-logo";
import { formatPrice } from "@/lib/format";
import type { OfferView } from "@/lib/queries/title";
import { offerTypeLabel, offerVerb } from "@/lib/services";

/** One legal option: service, offer type, price, edition-language status, deeplink. */
export function OfferRow({ offer, lang, titleName, country, primary }: { offer: OfferView; lang: string; titleName: string; country: string; primary?: boolean }) {
  const price = formatPrice(offer.price, offer.currency);
  const audio = offer.audio[lang];
  const sub = offer.subtitle[lang];
  const langNote =
    audio === "confirmed_yes"
      ? `${lang.toUpperCase()} audio ✓`
      : sub === "confirmed_yes"
        ? `${lang.toUpperCase()} subtitles only`
        : `${lang.toUpperCase()} audio not confirmed`;
  const parts = [offer.type === "rent" || offer.type === "buy" ? `${offerTypeLabel(offer.type)} ${price ?? ""}`.trim() : offerTypeLabel(offer.type), langNote, offer.quality === "uhd" ? "4K" : null].filter(Boolean);

  return (
    <li className="flex items-center gap-3 rounded-card bg-surface-2/60 p-3">
      <ServiceLogo {...offer.service} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-extrabold">{offer.service.name}</div>
        <div className={`line-clamp-2 text-xs ${audio === "confirmed_yes" ? "text-text-2" : "text-text-3"}`}>{parts.join(" · ")}</div>
      </div>
      <OutboundLink
        href={offer.url}
        service={offer.service.slug}
        title={titleName}
        country={country}
        lang={audio === "confirmed_yes" ? lang : undefined}
        offerType={offer.type}
        className={buttonClass(primary ? "primary" : "secondary", "sm")}
      >
        {primary ? `${offerVerb(offer.type)} on ${offer.service.name}` : offerVerb(offer.type)} ↗
      </OutboundLink>
    </li>
  );
}
