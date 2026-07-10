import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  await requireRole(await requireAuth(), ["ADMIN"]);

  const users = await prisma.systemUser.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      employeeNumber: true,
      name: true,
      department: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Admin</h1>
      <p className="mb-4 text-sm text-slate-500">
        System users. To add a user, run the seed script or insert directly via the DB.
      </p>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.employeeNumber}</td>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.department ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
