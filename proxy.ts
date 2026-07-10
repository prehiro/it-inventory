import { NextResponse, type NextRequest } from "next/server";
import { decode } from "next-auth/jwt";
import type { Role } from "@/lib/types";

// RBAC: which roles may access which route prefixes.
const ROLE_ROUTES: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/master-data": ["ADMIN"],
  "/reports": ["ADMIN", "MANAGER"],
};

// Edge-safe proxy (Next 16 renamed middleware -> proxy): decodes the session JWT cookie (no Prisma / no mssql).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await decode({
    token: req.cookies.get("authjs.session-token")?.value,
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });

  const isLoggedIn = !!token?.sub;
  const role = token?.role as Role | undefined;

  // Public routes
  if (pathname === "/login" || pathname === "/") {
    // If already logged in and hitting /login, send to dashboard
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-restricted prefixes
  for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix) && (!role || !allowed.includes(role))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
