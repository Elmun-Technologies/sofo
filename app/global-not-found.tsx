import type { Metadata } from "next";
import { NotFoundContent } from "@/app/[lang]/not-found";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EDITIONS } from "@/lib/editions";
import { manrope, nunito } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found · sofo",
  robots: { index: false },
};

/** Unmatched URLs (any root layout). Uses the TR edition shell — the only live edition. */
export default function GlobalNotFound() {
  const edition = EDITIONS.tr!;
  return (
    <html lang="en" className={`${manrope.variable} ${nunito.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader edition={edition} />
        <main className="grow">
          <NotFoundContent />
        </main>
        <SiteFooter edition={edition} />
      </body>
    </html>
  );
}
