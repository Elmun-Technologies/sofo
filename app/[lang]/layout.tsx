import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TabBar } from "@/components/tab-bar";
import { editionCodes, getEdition } from "@/lib/editions";
import { manrope, nunito } from "@/lib/fonts";
import { SITE_NAME, siteUrl } from "@/lib/site";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return editionCodes().map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
};

export default async function EditionLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const edition = getEdition(lang);
  if (!edition) notFound();

  return (
    <html lang={edition.hreflang} className={`${manrope.variable} ${nunito.variable}`}>
      <body className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <SiteHeader edition={edition} />
        <main className="grow">{children}</main>
        <SiteFooter edition={edition} />
        <TabBar routes={edition.routes} />
      </body>
    </html>
  );
}
