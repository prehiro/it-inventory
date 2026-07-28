import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";
import type { Role } from "@/lib/types";

export default async function DashboardPage() {
  const session = await requireAuth();
  const role = session.user.role as Role;

  const [
    total, available, deployed, returned, inRepair, disposed, models,
    byCategory, byDeptAgg, recentRaw, lowStockRaw, byType, byStatus,
  ] = await Promise.all([
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.item.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
    prisma.item.count({ where: { isDeleted: false, status: "RELEASED" } }),
    prisma.item.count({ where: { isDeleted: false, status: "RETURNED_KEEP" } }),
    prisma.item.count({ where: { isDeleted: false, status: "IN_REPAIR" } }),
    prisma.item.count({ where: { isDeleted: false, status: "PLAN_DISPOSE" } }),
    prisma.itemModel.count({ where: { isDeleted: false } }),
    prisma.item.groupBy({ by: ["modelId"], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.itemTxn.groupBy({
      by: ["assigneeDept"],
      where: { type: "RELEASE", item: { status: "RELEASED" } },
      _count: { _all: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" }, take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.itemModel.findMany({
      where: { isDeleted: false },
      include: { _count: { select: { items: { where: { isDeleted: false, status: "AVAILABLE" } } } } },
    }),
    prisma.itemModel.groupBy({ by: ["type"], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.item.groupBy({ by: ["status"], where: { isDeleted: false }, _count: { _all: true } }),
  ]);

  const modelsAll = await prisma.itemModel.findMany({ where: { isDeleted: false }, select: { id: true, category: true, model: true, type: true } });
  const catMap = new Map(modelsAll.map((m) => [m.id, m.category]));
  const catAgg = new Map<string, number>();
  for (const g of byCategory) {
    const cat = catMap.get(g.modelId) ?? "OTHER";
    catAgg.set(cat, (catAgg.get(cat) ?? 0) + g._count._all);
  }
  const donut = ["FA", "NCA", "GENERAL"].map((c) => ({ name: c, value: catAgg.get(c) ?? 0 }));
  const bar = byDeptAgg
    .filter((d) => d.assigneeDept)
    .map((d) => ({ dept: d.assigneeDept as string, count: d._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Status distribution
  const statusData = [
    { name: "Available", value: available, color: "#10b981" },
    { name: "Released", value: deployed, color: "#6366f1" },
    { name: "In Repair", value: inRepair, color: "#f59e0b" },
    { name: "Returned", value: returned, color: "#64748b" },
    { name: "Plan Dispose", value: disposed, color: "#f43f5e" },
  ].filter((s) => s.value > 0);

  // Model type breakdown
  const typeMap = new Map(modelsAll.map((m) => [m.id, m.type]));
  const typeAgg = new Map<string, number>();
  for (const g of byCategory) {
    const type = typeMap.get(g.modelId) ?? "OTHER";
    typeAgg.set(type, (typeAgg.get(type) ?? 0) + g._count._all);
  }
  const modelTypes = [...typeAgg.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const lowStock = lowStockRaw
    .filter((m) => m._count.items <= 2)
    .map((m) => ({ model: m.model, brand: m.brand, available: m._count.items }));

  const recent = recentRaw.map((r) => ({
    id: r.id,
    action: r.action,
    details: r.details,
    timestamp: r.timestamp,
    userName: r.user.name,
  }));

  return (
    <DashboardClient
      data={{
        total, available, released: deployed, returned, inRepair,
        planDispose: disposed, models,
        donut, bar, recent, lowStock, role,
        statusData, modelTypes,
      }}
    />
  );
}
