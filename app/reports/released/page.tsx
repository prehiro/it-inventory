import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReleasedItemsTable } from "../_components/released-items-table";

/* ──────────────────────────────────────────
   Released Item report — inventory currently available & ready to release
   Only statuses AVAILABLE + RETURNED_KEEP (deployed-returned, kept at store)
   ────────────────────────────────────────── */
export default async function ReleasedItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string; po?: string; location?: string; from?: string; to?: string; status?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const where: Record<string, unknown> = {
    isDeleted: false,
    status: { in: ["AVAILABLE", "RETURNED_KEEP"] },
  };
  if (sp.type && sp.type !== "All") where.model = { type: sp.type };
  if (sp.category && sp.category !== "All") where.model = { ...(where.model as object), category: sp.category };
  if (sp.po) where.poNumber = { contains: sp.po };
  if (sp.location) where.location = { contains: sp.location };
  if (sp.q) {
    where.OR = [
      { serialNumber: { contains: sp.q, mode: "insensitive" } },
      { model: { model: { contains: sp.q, mode: "insensitive" } } },
      { model: { brand: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.status && sp.status !== "All") {
    where.status = sp.status;
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

  const filter = {
    type: sp.type ?? "",
    category: sp.category ?? "",
    q: sp.q ?? "",
    po: sp.po ?? "",
    location: sp.location ?? "",
    from: sp.from ?? "",
    to: sp.to ?? "",
    status: sp.status ?? "",
  };
  const query = new URLSearchParams();
  if (filter.type) query.set("type", filter.type);
  if (filter.category) query.set("category", filter.category);
  if (filter.q) query.set("q", filter.q);
  if (filter.po) query.set("po", filter.po);
  if (filter.location) query.set("location", filter.location);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  if (filter.status) query.set("status", filter.status);
  const queryStr = query.toString();

  return (
    <div className="page-fill-height">
      <PageHeader
        title="Released Item"
        subtitle="Inventory available & ready to release"
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
