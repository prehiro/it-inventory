import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { AvailableItemsPanel } from "../_components/available-items-panel";
import { ReportsPagination } from "../_components/reports-pagination";

/* ──────────────────────────────────────────
   Released Item report — inventory currently available & ready to release
   Only statuses AVAILABLE + RETURNED_KEEP (deployed-returned, kept at store)
   ────────────────────────────────────────── */
export default async function ReleasedItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const where: Record<string, unknown> = {
    isDeleted: false,
    status: { in: ["AVAILABLE", "RETURNED_KEEP"] },
  };
  if (sp.type && sp.type !== "All") where.model = { type: sp.type };
  if (sp.category && sp.category !== "All") where.model = { ...(where.model as object), category: sp.category };
  if (sp.q) {
    where.OR = [
      { serialNumber: { contains: sp.q, mode: "insensitive" } },
      { model: { model: { contains: sp.q, mode: "insensitive" } } },
      { model: { brand: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.from || sp.to) {
    where.dateReceived = {};
    if (sp.from) (where.dateReceived as Record<string, unknown>).gte = new Date(sp.from);
    if (sp.to) (where.dateReceived as Record<string, unknown>).lte = new Date(sp.to);
  }

  const PAGE_SIZE = 30;
  const page = Math.max(1, Number(sp.page) || 1);

  // Default sort: newest received first (dateReceived desc) with a serial
  // number tiebreaker so the order is deterministic across refreshes.
  const [totalRows, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: [{ dateReceived: "desc" }, { serialNumber: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        serialNumber: true,
        status: true,
        poNumber: true,
        location: true,
        dateReceived: true,
        model: { select: { type: true, brand: true, model: true, category: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  // Summary counts by status (matches the ready-to-release scope)
  const statusCounts = await prisma.item.groupBy({
    by: ["status"],
    where: { isDeleted: false, status: { in: ["AVAILABLE", "RETURNED_KEEP"] } },
    _count: { _all: true },
  });
  const statusTotals: Record<string, number> = {};
  for (const c of statusCounts) statusTotals[c.status] = c._count._all;
  const totalReady = statusCounts.reduce((s, c) => s + c._count._all, 0);

  // Category snapshot counts (FA / NCA / GENERAL among ready-to-release)
  const readyModels = await prisma.itemModel.findMany({
    where: {
      isDeleted: false,
      items: { some: { isDeleted: false, status: { in: ["AVAILABLE", "RETURNED_KEEP"] } } },
    },
    select: { category: true, _count: { select: { items: true } } },
  });
  const catTotals: Record<string, number> = {};
  for (const m of readyModels) catTotals[m.category] = (catTotals[m.category] ?? 0) + m._count.items;

  const STATS = [
    {
      label: "Ready to Release",
      value: totalReady,
      tile: "bg-blue-600 text-white",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      label: "Available",
      value: statusTotals.AVAILABLE ?? 0,
      tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
    },
    {
      label: "Returned Keep",
      value: statusTotals.RETURNED_KEEP ?? 0,
      tile: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v4" />
        </svg>
      ),
    },
    {
      label: "FA",
      value: catTotals.FA ?? 0,
      tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      label: "NCA",
      value: catTotals.NCA ?? 0,
      tile: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  const filter = { type: sp.type ?? "", category: sp.category ?? "", q: sp.q ?? "", from: sp.from ?? "", to: sp.to ?? "" };
  const query = new URLSearchParams();
  if (filter.type) query.set("type", filter.type);
  if (filter.category) query.set("category", filter.category);
  if (filter.q) query.set("q", filter.q);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  const queryStr = query.toString();

  return (
    <div>
      <PageHeader
        title="Released Item"
        subtitle="Inventory available & ready to release"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
            <line x1="12" y1="3" x2="12" y2="15" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
          </svg>
        }
      />

      <AvailableItemsPanel basePath="/reports/released" initial={{ ...filter, page }} total={totalRows} stats={STATS} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-16 z-10 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Serial Number</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">PO Number</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No items ready to release.
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.serialNumber} className="row-hover">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{i.serialNumber}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{i.model.type}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{i.model.brand}</td>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{i.model.model}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          i.model.category === "FA"
                            ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400"
                            : i.model.category === "NCA"
                              ? "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/15 dark:text-purple-400"
                              : "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-400"
                        }`}
                      >
                        {i.model.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{i.poNumber || "—"}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{i.location}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(i.dateReceived)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ReportsPagination page={page} totalPages={totalPages} total={totalRows} pageSize={PAGE_SIZE} query={queryStr} basePath="/reports/released" />
      </div>
    </div>
  );
}
