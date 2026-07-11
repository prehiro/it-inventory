import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { RecentActivity } from "./recent-activity";
import { CategoryDonut, DepartmentBar } from "@/components/dashboard-charts";
import type { Role } from "@/lib/types";

export default async function DashboardPage() {
  await requireAuth();

  const session = await requireAuth();
  const role = session.user.role as Role;

  const [
    total, available, deployed, returned, inRepair, disposed, models,
    byCategory, byDeptAgg, recent, lowStockRaw,
  ] = await Promise.all([
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.item.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
    prisma.item.count({ where: { isDeleted: false, status: "DEPLOYED" } }),
    prisma.item.count({ where: { isDeleted: false, status: "RETURNED_KEEP" } }),
    prisma.item.count({ where: { isDeleted: false, status: "IN_REPAIR" } }),
    prisma.item.count({ where: { isDeleted: false, status: "DISPOSED" } }),
    prisma.itemModel.count({ where: { isDeleted: false } }),
    // category distribution (available + deployed per model category)
    prisma.item.groupBy({ by: ["modelId"], where: { isDeleted: false }, _count: { _all: true } }),
    // deployed by department
    prisma.itemTxn.groupBy({
      by: ["assigneeDept"],
      where: { type: "RELEASE", item: { status: "DEPLOYED" } },
      _count: { _all: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" }, take: 6,
      include: { user: { select: { name: true } } },
    }),
    // low stock: models with <=2 available
    prisma.itemModel.findMany({
      where: { isDeleted: false },
      include: { _count: { select: { items: { where: { isDeleted: false, status: "AVAILABLE" } } } } },
    }),
  ]);

  // map modelId -> category for donut
  const modelsAll = await prisma.itemModel.findMany({ where: { isDeleted: false }, select: { id: true, category: true, name: true } });
  const catMap = new Map(modelsAll.map((m) => [m.id, m.category]));
  const catAgg = new Map<string, number>();
  for (const g of byCategory) {
    const cat = catMap.get(g.modelId) ?? "OTHER";
    catAgg.set(cat, (catAgg.get(cat) ?? 0) + g._count._all);
  }
  const donut = ["FA", "NCA", "OTHER"].map((c) => ({ name: c, value: catAgg.get(c) ?? 0 }));
  const bar = byDeptAgg
    .filter((d) => d.assigneeDept)
    .map((d) => ({ dept: d.assigneeDept as string, count: d._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const lowStock = lowStockRaw
    .filter((m) => m._count.items <= 2)
    .map((m) => ({ name: m.name, available: m._count.items }));

  const cards = [
    { label: "Total Items", value: total, tone: "text-slate-900" },
    { label: "Available", value: available, tone: "text-emerald-600" },
    { label: "Deployed", value: deployed, tone: "text-indigo-600" },
    { label: "In Repair", value: inRepair, tone: "text-amber-600" },
    { label: "Disposed", value: disposed, tone: "text-rose-600" },
    { label: "Models", value: models, tone: "text-slate-900" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time overview of your IT inventory" />

      {lowStock.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">⚠ Low stock alert</p>
          <ul className="mt-1 text-sm text-amber-700">
            {lowStock.map((l) => (
              <li key={l.name}>{l.name}: only {l.available} available</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CategoryDonut data={donut} />
        <DepartmentBar data={bar} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Recent Activity</h2>
        <RecentActivity items={recent} />
      </div>
    </div>
  );
}
