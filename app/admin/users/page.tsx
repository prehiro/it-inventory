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
      <PageHeader title="User Management" subtitle="Create, manage, and control access for system users" />
      <UsersPageClient initialUsers={users} />
    </div>
  );
}
