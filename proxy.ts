import { NextResponse, type NextRequest } from "next/server";
import { adminAuthMode, checkBasicAuth } from "@/lib/admin/auth";

/**
 * Protects /admin/** with HTTP Basic auth (ADMIN_USER / ADMIN_PASSWORD).
 * Unset credentials → 404 in production; allowed in development with a "dev mode" banner.
 */
export async function proxy(request: NextRequest) {
  const mode = adminAuthMode();
  if (mode === "disabled") return new NextResponse("Not found", { status: 404 });

  if (mode === "basic") {
    const ok = await checkBasicAuth(request.headers.get("authorization"), process.env.ADMIN_USER!, process.env.ADMIN_PASSWORD!);
    if (!ok) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="sofo admin", charset="UTF-8"', "Cache-Control": "no-store" },
      });
    }
  }

  // Tell the admin layout which mode it runs in (never trust a client-sent value).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sofo-admin-auth", mode);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
