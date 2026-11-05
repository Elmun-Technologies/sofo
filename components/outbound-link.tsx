"use client";

import { track } from "@/lib/client/analytics";

type Props = {
  href: string;
  service: string;
  title: string;
  country: string;
  lang?: string;
  offerType?: string;
  className?: string;
  children: React.ReactNode;
};

/** Link to a legal service. Fires GA4 `outbound_click` (business rule 5: tracking from day one). */
export function OutboundLink({ href, service, title, country, lang, offerType, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener nofollow"
      className={className}
      onClick={() => track("outbound_click", { service, title, country, lang, offer_type: offerType })}
    >
      {children}
    </a>
  );
}
