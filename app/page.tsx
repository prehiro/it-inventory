import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { RecentActivity } from "./recent-activity";

export default async function DashboardPage() {
  await requireAuth();

  const [total, available, deployed, returned, models, recent] =
    await Promise.all([
      prisma.item.count({ where: { isDeleted: false } }),
      prisma.item.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
      prisma.item.count({ where: { isDeleted: false, status: "DEPLOYED" } }),
      prisma.item.count({ where: { isDeleted: false, status: "RETURNED_KEEP" } }),
      prisma.itemModel.count({ where: { isDeleted: false } }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 8,
        include: { user: { select: { name: true } } },
      }),
    ]);

  const cards = [
    { label: "Total Items", value: total },
    { label: "Available", value: available },
    { label: "Deployed", value: deployed },
    { label: "Returned", value: returned },
    { label: "Models", value: models },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Recent Activity</h2>
        <RecentActivity items={recent} />
      </div>
    </div>
  );
}
