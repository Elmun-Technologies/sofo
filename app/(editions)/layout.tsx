import type { Metadata } from "next";
import { Analytics } from "@/components/retention/analytics";
import { CookieBanner } from "@/components/retention/cookie-banner";
import { manrope, nunito } from "@/lib/fonts";
import { SITE_NAME, siteUrl } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: SITE_NAME,
};

/** Root layout for the edition picker at "/". No IP auto-redirect — the user chooses. */
export default function EditionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${nunito.variable}`}>
      <body className="min-h-dvh">
        {children}
        <CookieBanner privacyHref="/tr/gizlilik" />
        <Analytics />
      </body>
    </html>
  );
}
