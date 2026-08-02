import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReceivedItemsTable } from "../_components/received-items-table";

/* ──────────────────────────────────────────
   Received Item report — inventory received & still available
   (AVAILABLE only: fresh stock never released; RETURNED_KEEP lives under
   Released Item since it's ready-to-release again)
   ────────────────────────────────────────── */
export default async function ReceivedItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string; po?: string; location?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const where: Record<string, unknown> = {
    isDeleted: false,
    status: "AVAILABLE",
  };
  if (sp.type && sp.type !== "All") where.model = { type: sp.type };
  if (sp.category && sp.category !== "All") where.model = { ...(where.model as object), category: sp.category };
  if (sp.po) where.poNumber = { contains: sp.po };
  if (sp.location) where.location = { contains: sp.location };
  if (sp.q) {
    where.OR = [
      { serialNumber: { contains: sp.q } },
      { model: { model: { contains: sp.q } } },
      { model: { brand: { contains: sp.q } } },
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

  const filter = { type: sp.type ?? "", category: sp.category ?? "", q: sp.q ?? "", po: sp.po ?? "", location: sp.location ?? "", from: sp.from ?? "", to: sp.to ?? "" };
  const query = new URLSearchParams();
  if (filter.type) query.set("type", filter.type);
  if (filter.category) query.set("category", filter.category);
  if (filter.q) query.set("q", filter.q);
  if (filter.po) query.set("po", filter.po);
  if (filter.location) query.set("location", filter.location);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  const queryStr = query.toString();

  return (
    <div className="page-fill-height">
      <PageHeader
        title="Received Item Report"
        subtitle="List of New Received Item -  Available and ready to release"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
            <line x1="12" y1="15" x2="12" y2="3" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
          </svg>
        }
      />

      <ReceivedItemsTable
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
