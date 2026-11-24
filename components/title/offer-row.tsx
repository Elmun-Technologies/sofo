import { ArrowUpRightIcon } from "@/components/icons";
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
  const code = lang.toUpperCase();
  const paid = offer.type === "rent" || offer.type === "buy";

  return (
    <li className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
      <ServiceLogo {...offer.service} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[15px] font-bold">{offer.service.name}</span>
          <span className="tnum shrink-0 text-xs text-text-3">{paid ? `${offerTypeLabel(offer.type)} ${price ?? ""}`.trim() : offerTypeLabel(offer.type)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold">
          {audio === "confirmed_yes" ? (
            <span className="inline-flex items-center gap-1.5 text-[#8ab4ff]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-dub" />
              {code} audio
            </span>
          ) : (
            <span className="text-leaving/90">{code} audio not confirmed</span>
          )}
          {sub === "confirmed_yes" ? <span className="text-text-2">{code} subs</span> : null}
          {offer.quality === "uhd" ? <span className="rounded-[4px] px-1 text-[10px] leading-4 text-text-2 ring-1 ring-hairline-strong ring-inset">4K</span> : null}
        </div>
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
        {offerVerb(offer.type)}
        <ArrowUpRightIcon className="size-3.5" />
        <span className="sr-only">
          {" "}
          {titleName} on {offer.service.name}
        </span>
      </OutboundLink>
    </li>
  );
}
