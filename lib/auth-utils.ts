import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

/**
 * Server-side guard for pages. Call at the top of a page/layout:
 *   const session = await requireAuth();
 *   requireRole(session, ["ADMIN"]);
 * Redirects to /login if not authed, or / if role not allowed.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export function requireRole(
  session: { user?: { role?: Role } } | null,
  allowed: Role[],
) {
  const role = session?.user?.role;
  if (!role || !allowed.includes(role)) redirect("/");
}
