import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { ArrowUpRightIcon, InfoIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { adminAuthMode } from "@/lib/admin/auth";
import { manrope, nunito } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin · sofo", template: "%s · Admin · sofo" },
  robots: { index: false, follow: false, nocache: true },
};

/** Internal admin root layout (own <html>, desktop-first). Auth: proxy.ts + requireAdmin() in actions. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const mode = h.get("x-sofo-admin-auth") ?? adminAuthMode();

  return (
    <html lang="en" className={`${manrope.variable} ${nunito.variable}`}>
      <body className="min-h-dvh">
        {mode === "dev" ? (
          <div role="alert" className="flex items-center justify-center gap-2 border-b border-leaving/25 px-4 py-2 text-center text-xs font-medium text-leaving">
            <InfoIcon className="size-3.5 shrink-0" />
            Dev mode, no auth — set ADMIN_USER and ADMIN_PASSWORD to protect /admin
          </div>
        ) : null}
        <div className="lg:flex">
          <aside className="flex flex-col border-b border-hairline px-4 pt-4 pb-3 lg:sticky lg:top-0 lg:h-dvh lg:w-[248px] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
            <div className="mb-4 flex items-center gap-2.5 px-2 lg:mb-8">
              <Link href="/admin">
                <Logo className="text-[22px]" />
              </Link>
              <span className="tag !h-6 !px-2.5 !text-[11px]">Admin</span>
              <Link href="/" target="_blank" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-text-3 lg:hidden">
                View site
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            </div>
            <AdminNav />
            <Link href="/" target="_blank" className="mt-auto hidden h-10 items-center gap-3 rounded-full px-4 text-sm font-medium text-text-3 transition-colors duration-200 hover:bg-text/5 hover:text-text lg:flex">
              <ArrowUpRightIcon className="size-4" />
              View site
            </Link>
          </aside>
          <main className="min-w-0 grow px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[1320px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
