import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export default async function ReportsPage() {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);

  const txns = await prisma.itemTxn.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: {
      item: { select: { serialNumber: true } },
      operator: { select: { name: true } },
    },
  });

  const typeLabel: Record<string, string> = {
    RECEIVE: "Received",
    RELEASE: "Released",
    RETURN: "Returned",
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Reports</h1>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {txns.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 whitespace-nowrap">{t.date.toLocaleDateString()}</td>
                <td className="px-4 py-3">{typeLabel[t.type] ?? t.type}</td>
                <td className="px-4 py-3">{t.item.serialNumber}</td>
                <td className="px-4 py-3">{t.operator.name}</td>
                <td className="px-4 py-3 text-slate-500">
                  {t.assigneeName ?? t.returningPicName ?? t.remarks ?? "—"}
                </td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
