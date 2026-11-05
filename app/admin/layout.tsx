import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
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
          <div role="alert" className="bg-leaving px-4 py-1.5 text-center text-xs font-extrabold text-ink">
            Dev mode, no auth — set ADMIN_USER and ADMIN_PASSWORD to protect /admin
          </div>
        ) : null}
        <div className="lg:flex">
          <aside className="border-b border-line px-3 py-3 lg:sticky lg:top-0 lg:h-dvh lg:w-[244px] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-3 lg:py-5">
            <div className="mb-3 flex items-center gap-2 px-2 lg:mb-6">
              <Link href="/admin" className="hover:text-text">
                <Logo className="text-[22px]" />
              </Link>
              <span className="rounded-[6px] bg-surface-2 px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide">ADMIN</span>
            </div>
            <AdminNav />
          </aside>
          <main className="min-w-0 grow px-4 py-6 sm:px-8 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
