"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "./consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const VALID_ID = !!GA_ID && /^G-[A-Z0-9]{4,16}$/.test(GA_ID);

/**
 * GA4 loader. Renders nothing until the user accepted analytics (KVKK: non-essential rejected by default).
 * IP anonymised, no ad signals / personalisation. Revoking sets the GA opt-out flag.
 */
export function Analytics() {
  const { consent } = useConsent();
  const allowed = VALID_ID && consent?.analytics === true;

  useEffect(() => {
    if (!VALID_ID) return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = !allowed;
  }, [allowed]);

  if (!allowed) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());
gtag('config','${GA_ID}',{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}
