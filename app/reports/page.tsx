import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ReportsFilter } from "./reports-filter";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; from?: string; to?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.type) where.type = sp.type;
  if (sp.status) where.item = { status: sp.status };
  if (sp.from || sp.to) {
    where.date = {};
    if (sp.from) (where.date as Record<string, unknown>).gte = new Date(sp.from);
    if (sp.to) (where.date as Record<string, unknown>).lte = new Date(sp.to);
  }

  const txns = await prisma.itemTxn.findMany({
    where,
    orderBy: { date: "desc" },
    take: 100,
    include: {
      item: { select: { serialNumber: true, status: true } },
      operator: { select: { name: true } },
    },
  });

  const typeLabel: Record<string, string> = { RECEIVE: "Received", RELEASE: "Released", RETURN: "Returned" };
  const filter = { type: sp.type ?? "", status: sp.status ?? "", from: sp.from ?? "", to: sp.to ?? "" };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Movement history with filters & export" />
      <ReportsFilter initial={filter} count={txns.length} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Serial</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Operator</th>
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {txns.map((t) => (
              <tr key={t.id} className="row-hover">
                <td className="whitespace-nowrap px-5 py-3 text-slate-500 dark:text-slate-400">{t.date.toLocaleDateString()}</td>
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{typeLabel[t.type] ?? t.type}</td>
                <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{t.item.serialNumber}</td>
                <td className="px-5 py-3"><StatusBadge status={t.item.status} /></td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.operator.name}</td>
                <td className="px-5 py-3 text-slate-400 dark:text-slate-500">{t.assigneeName ?? t.returningPicName ?? t.remarks ?? "—"}</td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No transactions match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
