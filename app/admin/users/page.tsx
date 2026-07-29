import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { UsersPageClient } from "./users-page-client";

export default async function UsersPage() {
  await requireRole(await requireAuth(), ["ADMIN"]);

  const users = await prisma.systemUser.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: { employeeNumber: true, name: true, department: true, role: true },
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create, manage, and control access for system users"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" className="animate-user-alt" />
            <circle cx="9" cy="7" r="4" className="animate-user-alt" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" className="animate-user-alt-delayed" />
          </svg>
        }
      />
      <UsersPageClient initialUsers={users} />
    </div>
  );
}
