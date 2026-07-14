import { prisma } from "@/lib/db";

export async function AvailableItemsTable() {
  const items = await prisma.item.findMany({
    where: { isDeleted: false, status: { in: ["AVAILABLE", "RETURNED_KEEP"] } },
    orderBy: { dateReceived: "asc" },
    select: {
      serialNumber: true,
      status: true,
      dateReceived: true,
      model: { select: { type: true, brand: true, model: true, category: true } },
    },
  });

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Available Items</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Items ready to Release</p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Serial Number</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No available items.
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.serialNumber} className="text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-3 font-mono text-xs">{i.serialNumber}</td>
                    <td className="px-4 py-3">{i.model.type}</td>
                    <td className="px-4 py-3">{i.model.brand}</td>
                    <td className="px-4 py-3">{i.model.model}</td>
                    <td className="px-4 py-3">{i.model.category}</td>
                    <td className="px-4 py-3">
                      {i.status === "RETURNED_KEEP" ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300">
                          {i.status}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400">
                          {i.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
