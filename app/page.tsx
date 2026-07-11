import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { RecentActivity } from "./recent-activity";
import { CategoryDonut, DepartmentBar } from "@/components/dashboard-charts";
import type { Role } from "@/lib/types";

const CARD_ICONS: Record<string, { path: string; tone: string }> = {
  "Total Items": { path: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10", tone: "text-slate-400 bg-slate-100" },
  "Available": { path: "M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", tone: "text-emerald-600 bg-emerald-50" },
  "Deployed": { path: "M7 17L17 7M9 7h8v8", tone: "text-indigo-600 bg-indigo-50" },
  "In Repair": { path: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z", tone: "text-amber-600 bg-amber-50" },
  "Disposed": { path: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13", tone: "text-rose-600 bg-rose-50" },
  "Models": { path: "M3 7h8l-1 5h4l-1 5H3zM13 12h8M13 17h8", tone: "text-slate-500 bg-slate-100" },
};

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
    prisma.item.groupBy({ by: ["modelId"], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.itemTxn.groupBy({
      by: ["assigneeDept"],
      where: { type: "RELEASE", item: { status: "DEPLOYED" } },
      _count: { _all: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" }, take: 6,
      include: { user: { select: { name: true } } },
    }),
    prisma.itemModel.findMany({
      where: { isDeleted: false },
      include: { _count: { select: { items: { where: { isDeleted: false, status: "AVAILABLE" } } } } },
    }),
  ]);

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
        {cards.map((c) => {
          const ic = CARD_ICONS[c.label];
          return (
            <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
                {ic && (
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ic.tone}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ic.path} />
                    </svg>
                  </span>
                )}
              </div>
              <p className={`mt-2 text-3xl font-semibold ${c.tone}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CategoryDonut data={donut} />
          <DepartmentBar data={bar} />
        </div>
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <h2 className="mb-3 text-lg font-medium text-slate-900">Recent Activity</h2>
            <RecentActivity items={recent} />
          </div>
        </div>
      </div>
    </div>
  );
}
