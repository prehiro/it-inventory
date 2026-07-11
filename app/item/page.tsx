import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { notFound } from "next/navigation";

export default async function ItemPage({
  searchParams,
}: {
  searchParams: Promise<{ serial?: string }>;
}) {
  await requireAuth();
  const { serial } = await searchParams;
  if (!serial) notFound();

  const item = await prisma.item.findFirst({
    where: { serialNumber: serial, isDeleted: false },
    include: {
      model: true,
      transactions: { orderBy: { date: "desc" }, include: { operator: { select: { name: true } } } },
    },
  });
  if (!item) notFound();

  const typeLabel: Record<string, string> = { RECEIVE: "Received", RELEASE: "Released", RETURN: "Returned" };

  return (
    <div className="max-w-3xl">
      <PageHeader title={item.serialNumber} subtitle={`${item.model.brand} ${item.model.name}`} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-400">Status</p>
          <div className="mt-1"><StatusBadge status={item.status} /></div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-400">Category</p>
          <p className="mt-1 text-sm font-medium">{item.model.category}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-400">PO Number</p>
          <p className="mt-1 text-sm font-medium">{item.poNumber ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-400">Location</p>
          <p className="mt-1 text-sm font-medium">{item.location}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Movement History</h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Operator</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {item.transactions.map((t) => (
                <tr key={t.id} className="row-hover">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">{t.date.toLocaleString()}</td>
                  <td className="px-5 py-3 font-medium">{typeLabel[t.type] ?? t.type}</td>
                  <td className="px-5 py-3 text-slate-600">{t.operator.name}</td>
                  <td className="px-5 py-3 text-slate-400">{t.assigneeName ?? t.returningPicName ?? t.remarks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
