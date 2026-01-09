import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Immer erlauben (sonst Endlos-Redirects / kaputte Assets)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // ✅ Nur Dashboard schützen (Dummy-Auth über Cookie)
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("token")?.value; // Dummy cookie name

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// ✅ Middleware läuft nur auf diesen Pfaden
export const config = {
  matcher: ["/dashboard/:path*"],
};
