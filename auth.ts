import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/types";

// RBAC: which roles may access which route prefixes.
const ROLE_ROUTES: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/master-data": ["ADMIN"],
  "/reports": ["ADMIN", "MANAGER"],
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT session strategy is REQUIRED for the Credentials provider on SQL Server.
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        employeeNumber: { label: "Employee Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const employeeNumber = typeof raw.employeeNumber === "string" ? raw.employeeNumber : "";
        const password = typeof raw.password === "string" ? raw.password : "";
        if (!employeeNumber || !password) return null;

        const user = await prisma.systemUser.findFirst({
          where: { employeeNumber, isDeleted: false },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          employeeNumber: user.employeeNumber,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.employeeNumber = (user as { employeeNumber: string }).employeeNumber;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.employeeNumber = token.employeeNumber as string;
      }
      return session;
    },
    // Middleware-level RBAC gate (runs on every matched request).
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes
      if (pathname === "/login") return true;
      if (pathname === "/") return true;

      if (!isLoggedIn) {
        // Redirect unauthenticated users to /login
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Role-restricted prefixes
      for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(prefix)) {
          const role = auth?.user?.role as Role | undefined;
          if (!role || !allowed.includes(role)) {
            // Logged in but lacks permission -> send to dashboard
            return Response.redirect(new URL("/", nextUrl));
          }
        }
      }
      return true;
    },
  },
});

// Re-export route handlers for app/api/auth/[...nextauth]/route.ts
export const { GET, POST } = handlers;
