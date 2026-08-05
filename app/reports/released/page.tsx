import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReleasedItemsTable } from "../_components/released-items-table";

/* ──────────────────────────────────────────
   Released Item report — items currently in RELEASED status
   (assets deployed/released to users, tracked via release transactions)
   ────────────────────────────────────────── */
export default async function ReleasedItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string; po?: string; location?: string; from?: string; to?: string; assignee?: string; hostname?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const where: Record<string, unknown> = {
    isDeleted: false,
    status: { in: ["RELEASED"] },
  };
  if (sp.type && sp.type !== "All") where.model = { type: sp.type };
  if (sp.category && sp.category !== "All") where.model = { ...(where.model as object), category: sp.category };
  if (sp.po) where.poNumber = { contains: sp.po };
  if (sp.hostname) where.hostname = { contains: sp.hostname };
  // Location/assignee/date filters all target the RELEASE txn (for released
  // items the destination is the assignee's department; item.location stays
  // "IT Store" from receive). Merge them into one `some` filter.
  const txnFilter: Record<string, unknown> = { type: "RELEASE" };
  if (sp.location) txnFilter.assigneeDept = { contains: sp.location };
  if (sp.assignee) {
    txnFilter.OR = [
      { assigneeName: { contains: sp.assignee } },
      { assigneeEmpNumber: { contains: sp.assignee } },
      { gid: { contains: sp.assignee } },
      { email: { contains: sp.assignee } },
    ];
  }
  if (sp.from || sp.to) {
    const date: Record<string, unknown> = {};
    if (sp.from) date.gte = new Date(sp.from);
    if (sp.to) date.lte = new Date(sp.to);
    txnFilter.date = date;
  }
  if (sp.location || sp.assignee || sp.from || sp.to) {
    where.transactions = { some: txnFilter };
  }
  if (sp.q) {
    where.OR = [
      { serialNumber: { contains: sp.q } },
      { model: { model: { contains: sp.q } } },
      { model: { brand: { contains: sp.q } } },
    ];
  }

  const PAGE_SIZE = 30;
  const page = Math.max(1, Number(sp.page) || 1);

  // Default sort: newest released first — use the latest RELEASE txn date.
  // We fetch the latest release txn per item to display assignee + released date.
  const [totalRows, rawItems] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: [{ dateReceived: "desc" }, { serialNumber: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        serialNumber: true,
        poNumber: true,
        location: true,
        dateReceived: true,
        hostname: true,
        model: { select: { type: true, brand: true, model: true, category: true } },
        transactions: {
          where: { type: "RELEASE" },
          orderBy: { date: "desc" },
          take: 1,
          select: {
            date: true,
            assigneeName: true,
            assigneeEmpNumber: true,
            assigneeDept: true,
            gid: true,
            email: true,
            remarks: true,
          },
        },
      },
    }),
  ]);
  // Group rows by release date — sort by latest release date first so
  // the day-grouped table reads newest → oldest (deterministic tiebreak).
  const items = rawItems.sort((a, b) => {
    const da = a.transactions[0]?.date ?? a.dateReceived;
    const db = b.transactions[0]?.date ?? b.dateReceived;
    const diff = db.getTime() - da.getTime();
    if (diff !== 0) return diff;
    return a.serialNumber.localeCompare(b.serialNumber);
  });
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const filter = {
    type: sp.type ?? "",
    category: sp.category ?? "",
    q: sp.q ?? "",
    po: sp.po ?? "",
    location: sp.location ?? "",
    from: sp.from ?? "",
    to: sp.to ?? "",
    assignee: sp.assignee ?? "",
    hostname: sp.hostname ?? "",
  };
  const query = new URLSearchParams();
  if (filter.type) query.set("type", filter.type);
  if (filter.category) query.set("category", filter.category);
  if (filter.q) query.set("q", filter.q);
  if (filter.po) query.set("po", filter.po);
  if (filter.location) query.set("location", filter.location);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  if (filter.assignee) query.set("assignee", filter.assignee);
  if (filter.hostname) query.set("hostname", filter.hostname);
  const queryStr = query.toString();

  return (
    <div className="page-fill-height">
      <PageHeader
        title="Released Item"
        subtitle="Items currently released to users"
        align="center"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
            <line x1="12" y1="3" x2="12" y2="15" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
          </svg>
        }
      />

      <ReleasedItemsTable
        items={items}
        total={totalRows}
        page={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        query={queryStr}
        filter={filter}
      />
    </div>
  );
}
