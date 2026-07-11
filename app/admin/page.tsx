import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";

export default async function AdminPage() {
  await requireRole(await requireAuth(), ["ADMIN"]);

  const [users, logs] = await Promise.all([
    prisma.systemUser.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: { employeeNumber: true, name: true, department: true, role: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Admin" subtitle="System users & audit trail" />
      <p className="mb-4 text-sm text-slate-500">
        To add a user, run the seed script or insert directly via the DB.
      </p>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Employee #</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.employeeNumber} className="row-hover">
                <td className="px-5 py-3 font-medium text-slate-800">{u.employeeNumber}</td>
                <td className="px-5 py-3 text-slate-700">{u.name}</td>
                <td className="px-5 py-3 text-slate-500">{u.department ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-medium text-slate-900">Audit Trail</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {logs.map((l) => (
          <li key={l.id} className="row-hover flex items-center justify-between px-5 py-3 text-sm">
            <div className="min-w-0">
              <span className="font-medium text-slate-800">{l.action}</span>
              <span className="ml-2 truncate text-slate-400">{l.details}</span>
            </div>
            <span className="ml-4 shrink-0 text-xs text-slate-400">{l.user.name} · {l.timestamp.toLocaleString()}</span>
          </li>
        ))}
        {logs.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-400">No logs yet.</li>}
      </ul>
    </div>
  );
}
