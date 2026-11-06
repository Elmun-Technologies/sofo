import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoBanner } from "@/components/demo-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/retention/analytics";
import { CookieBanner } from "@/components/retention/cookie-banner";
import { OnboardingModal } from "@/components/retention/onboarding-modal";
import { TabBar } from "@/components/tab-bar";
import { getServices } from "@/lib/catalog";
import { getEdition } from "@/lib/editions";
import { manrope, nunito } from "@/lib/fonts";
import { DEMO_DATA, SITE_NAME, siteUrl } from "@/lib/site";
import "../globals.css";

// No build-time params (D1 isn't reachable during the build — ADR 0002). Returning [] still makes the
// segment ISR-cacheable: pages render on first request, then serve from cache. Unknown codes 404 below.
export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  ...(DEMO_DATA ? { robots: { index: false, follow: false } } : {}),
};

export default async function EditionLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();
  const services = (await getServices(edition)).map((s) => ({ slug: s.slug, name: s.name, logoPath: s.logoPath }));

  return (
    <html lang={edition.hreflang} className={`${manrope.variable} ${nunito.variable}`}>
      <body className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <DemoBanner />
        <SiteHeader edition={edition} />
        <main className="grow">{children}</main>
        <SiteFooter edition={edition} />
        <TabBar routes={edition.routes} />
        <OnboardingModal
          edition={{ code: edition.code, countryName: edition.countryName, contentLang: edition.contentLang, coreServices: edition.coreServices }}
          services={services}
        />
        <CookieBanner privacyHref={edition.routes.privacy} />
        <Analytics />
      </body>
    </html>
  );
}
