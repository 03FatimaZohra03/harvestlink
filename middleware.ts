import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "./lib/session";
import { verifyAdminSession } from "./lib/admin-auth-server";

const PROTECTED_PREFIXES = ["/dashboard"];
const PROTECTED_API_PREFIXES = ["/api/dashboard"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Attach user info to request headers for downstream use
  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.sub);
  res.headers.set("x-user-account-type", payload.accountType);
  return res;
}

export async function adminMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin route protection
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  // Special case: /admin/login and /api/admin/login are PUBLIC (otherwise no one could log in)
  const isAdminPublicPath = pathname === "/admin/login" || pathname === "/api/admin/login";

  if (isAdminPath && !isAdminPublicPath) {
    const adminToken = req.cookies.get("hl_admin_session")?.value;
    const adminPayload = await verifyAdminSession(adminToken);
    if (!adminPayload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }
      const adminLoginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/api/dashboard/:path*", "/admin/:path*", "/api/admin/:path*"],
};
