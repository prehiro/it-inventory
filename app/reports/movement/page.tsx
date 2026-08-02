import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReportsFilter } from "../_components/reports-filter";
import { ReportsPagination } from "../_components/reports-pagination";
import { ReportTable, groupByDay, type TxnRow } from "../_components/report-table";
import { ReportStatStrip } from "../_components/report-stats";

/* ──────────────────────────────────────────
   Movement History — all transaction types (the original Reports page)
   ────────────────────────────────────────── */
export default async function MovementHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.type) where.type = sp.type;
  if (sp.status) where.statusAfter = sp.status;
  if (sp.from || sp.to) {
    where.date = {};
    if (sp.from) (where.date as Record<string, unknown>).gte = new Date(sp.from);
    if (sp.to) (where.date as Record<string, unknown>).lte = new Date(sp.to);
  }

  const PAGE_SIZE = 25;
  const page = Math.max(1, Number(sp.page) || 1);

  // Count + rows for current page (server-side pagination)
  const [totalRows, txns] = await Promise.all([
    prisma.itemTxn.count({ where }),
    prisma.itemTxn.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        item: { select: { serialNumber: true, status: true } },
        operator: { select: { name: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  // Summary counts — grouped by transaction type (single query)
  const typeCounts = await prisma.itemTxn.groupBy({
    by: ["type"],
    where,
    _count: { _all: true },
  });
  const typeTotals: Record<string, number> = {};
  for (const c of typeCounts) typeTotals[c.type] = c._count._all;
  const totalCount = typeCounts.reduce((s, c) => s + c._count._all, 0);

  // Status snapshot counts (matches statusAfter badge shown in table)
  const statusCounts = await prisma.itemTxn.groupBy({
    by: ["statusAfter"],
    where,
    _count: { _all: true },
  });
  const statusTotals: Record<string, number> = {};
  for (const c of statusCounts) statusTotals[c.statusAfter] = c._count._all;

  const STATS = [
    {
      label: "Total",
      value: totalCount,
      tile: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="M7 14v4" /><path d="M12 10v8" /><path d="M17 6v12" />
        </svg>
      ),
    },
    {
      label: "Received",
      value: typeTotals.RECEIVE ?? 0,
      tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16" /><path d="M4 7l2-3h12l2 3" /><path d="M4 7v13h16V7" /><path d="M12 11v6" /><path d="M9 14l3 3 3-3" />
        </svg>
      ),
    },
    {
      label: "Released",
      value: typeTotals.RELEASE ?? 0,
      tile: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16" /><path d="M4 7l2-3h12l2 3" /><path d="M4 7v13h16V7" /><path d="M12 15V9" /><path d="M9 12l3-3 3 3" />
        </svg>
      ),
    },
    {
      label: "Returned",
      value: typeTotals.RETURN ?? 0,
      tile: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v4" />
        </svg>
      ),
    },
    {
      label: "Plan Dispose",
      value: statusTotals.PLAN_DISPOSE ?? 0,
      tile: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
        </svg>
      ),
    },
  ];

  const typeLabel: Record<string, string> = { RECEIVE: "Received", RELEASE: "Released", RETURN: "Returned" };
  const filter = { type: sp.type ?? "", status: sp.status ?? "", from: sp.from ?? "", to: sp.to ?? "" };
  const query = new URLSearchParams();
  if (filter.type) query.set("type", filter.type);
  if (filter.status) query.set("status", filter.status);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  const queryStr = query.toString();

  const groups = groupByDay(txns as TxnRow[]);

  return (
    <div>
      <PageHeader
        title="Movement History"
        subtitle="All item movement records"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round">
            <path d="M9 17V9" className="animate-report-bar" style={{ animationDelay: "0s" }} />
            <path d="M13 17V5" className="animate-report-bar" style={{ animationDelay: "0.4s" }} />
            <path d="M17 17v-6" className="animate-report-bar" style={{ animationDelay: "0.8s" }} />
            <path d="M4 4h16v16H4z" />
          </svg>
        }
      />

      {/* Summary stat strip */}
      <ReportStatStrip stats={STATS} />
      <ReportsFilter key="movement" initial={filter} basePath="/reports/movement" />

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <ReportTable groups={groups} columns="movement" />
        <ReportsPagination page={page} totalPages={totalPages} total={totalRows} pageSize={PAGE_SIZE} query={queryStr} basePath="/reports/movement" />
      </div>
    </div>
  );
}
