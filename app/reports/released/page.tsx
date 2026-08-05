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
  searchParams: Promise<{ type?: string; category?: string; q?: string; serial?: string; brand?: string; model?: string; po?: string; location?: string; from?: string; to?: string; assignee?: string; hostname?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  // Backward compat: legacy ?q= mapped to serial+brand+model OR. New UI sends
  // separate ?serial=&brand=&model= which AND together (one field per column).
  const serial = sp.serial ?? "";
  const brand = sp.brand ?? "";
  const model = sp.model ?? "";
  const legacyQ = sp.q ?? "";

  const where: Record<string, unknown> = {
    isDeleted: false,
    status: { in: ["RELEASED"] },
  };
  if (sp.type && sp.type !== "All") where.model = { type: sp.type };
  if (sp.category && sp.category !== "All") where.model = { ...(where.model as object), category: sp.category };
  if (sp.po) where.poNumber = { contains: sp.po };
  if (sp.hostname) where.hostname = { contains: sp.hostname };
  // Column-scoped AND filters (serial / brand / model), each `contains`.
  const ands: Record<string, unknown>[] = [];
  if (serial) ands.push({ serialNumber: { contains: serial } });
  if (brand) ands.push({ model: { brand: { contains: brand } } });
  if (model) ands.push({ model: { model: { contains: model } } });
  // Legacy ?q= (single free-text across all three) kept for old links.
  if (legacyQ) {
    where.OR = [
      { serialNumber: { contains: legacyQ } },
      { model: { model: { contains: legacyQ } } },
      { model: { brand: { contains: legacyQ } } },
    ];
  }
  if (ands.length) where.AND = ands;

  const PAGE_SIZE = 30;
  const page = Math.max(1, Number(sp.page) || 1);

  // Location / assignee / date filters target the LATEST RELEASE txn — the same row
  // the UI displays (transactions[0]). `some` alone would match ANY old release txn
  // (e.g. an item previously at "Anode" whose latest dept is now "PE" — wrong).
  // Fetch ALL matching items + each latest RELEASE txn, then filter & paginate in JS
  // so the filtered result set is always consistent with what the rows render.
  const rawItems = await prisma.item.findMany({
    where,
    orderBy: [{ dateReceived: "desc" }, { serialNumber: "asc" }],
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
  });

  // ── Filter by LATEST RELEASE txn (in-memory, mirrors what the table displays) ──
  const latest = (i: (typeof rawItems)[number]) => i.transactions[0];

  const matchesLatest = (i: (typeof rawItems)[number]) => {
    const t = latest(i);
    const dept = t?.assigneeDept ?? i.location;
    const emp = t?.assigneeEmpNumber ?? "";
    const gid = t?.gid ?? "";
    const email = t?.email ?? "";
    const name = t?.assigneeName ?? "";
    const d = t?.date ?? i.dateReceived;
    if (sp.location && !dept.toLowerCase().includes(sp.location.toLowerCase())) return false;
    if (sp.assignee) {
      const hay = `${name} ${emp} ${gid} ${email}`.toLowerCase();
      if (!hay.includes(sp.assignee.toLowerCase())) return false;
    }
    if (sp.from && d < new Date(sp.from)) return false;
    if (sp.to) {
      const end = new Date(`${sp.to}T23:59:59.999`);
      if (d > end) return false;
    }
    return true;
  };

  const filtered = rawItems.filter(matchesLatest).sort((a, b) => {
    const da = latest(a)?.date ?? a.dateReceived;
    const db = latest(b)?.date ?? b.dateReceived;
    const diff = db.getTime() - da.getTime();
    if (diff !== 0) return diff;
    return a.serialNumber.localeCompare(b.serialNumber);
  });
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filter = {
    type: sp.type ?? "",
    category: sp.category ?? "",
    serial: sp.serial ?? "",
    brand: sp.brand ?? "",
    model: sp.model ?? "",
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
  if (filter.serial) query.set("serial", filter.serial);
  if (filter.brand) query.set("brand", filter.brand);
  if (filter.model) query.set("model", filter.model);
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
