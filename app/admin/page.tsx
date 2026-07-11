import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { CreateUserForm } from "./create-user-form";
import { RoleSelect, DeleteUserButton } from "./user-controls";
import { auditView, TONE_CLASS } from "@/lib/audit-format";

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
      <PageHeader title="Admin" subtitle="User management & audit trail" />

      <h2 className="mb-3 text-lg font-medium text-slate-900">Create User</h2>
      <CreateUserForm />

      <h2 className="mb-3 mt-8 text-lg font-medium text-slate-900">Users</h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Employee #</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.employeeNumber} className="row-hover">
                <td className="px-5 py-3 font-medium text-slate-800">{u.employeeNumber}</td>
                <td className="px-5 py-3 text-slate-700">{u.name}</td>
                <td className="px-5 py-3 text-slate-500">{u.department ?? "—"}</td>
                <td className="px-5 py-3"><RoleSelect employeeNumber={u.employeeNumber} role={u.role} /></td>
                <td className="px-5 py-3 text-right"><DeleteUserButton employeeNumber={u.employeeNumber} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-medium text-slate-900">Audit Trail</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {logs.map((l) => {
          const v = auditView(l.action, l.details);
          const Icon = v.icon;
          return (
            <li key={l.id} className="row-hover flex items-center gap-3 px-5 py-3.5">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>{v.label}</span>
                  <span className="truncate text-sm text-slate-600">{v.summary}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{l.user.name} · {l.timestamp.toLocaleString()}</p>
              </div>
            </li>
          );
        })}
        {logs.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-400">No logs yet.</li>}
      </ul>
    </div>
  );
}
