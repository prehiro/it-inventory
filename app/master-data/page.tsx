import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { CreateModelForm } from "./create-model-form";

export default async function MasterDataPage() {
  await requireRole(await requireAuth(), ["ADMIN"]);

  const models = await prisma.itemModel.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader title="Master Data" subtitle="Item models in your catalog" />
      <CreateModelForm />
      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {models.map((m) => (
              <tr key={m.id} className="row-hover">
                <td className="px-5 py-3 font-medium text-slate-800">{m.name}</td>
                <td className="px-5 py-3 text-slate-600">{m.brand}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{m.category}</span>
                </td>
                <td className="px-5 py-3 text-slate-600">{m._count.items}</td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No models yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
