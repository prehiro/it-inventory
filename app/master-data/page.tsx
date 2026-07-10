import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
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
      <h1 className="mb-6 text-2xl font-semibold">Master Data</h1>
      <CreateModelForm />
      <div className="mt-8 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {models.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3">{m.brand}</td>
                <td className="px-4 py-3">{m.category}</td>
                <td className="px-4 py-3">{m._count.items}</td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No models yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
