import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReturnedItemsTable } from "../_components/returned-items-table";

/* ──────────────────────────────────────────
   Returned Item report — items returned by users (RETURN transactions).
   Every row = one RETURN txn; date / PIC / status / reason come from the
   txn itself (not the item's current state).
   ────────────────────────────────────────── */
export default async function ReturnedItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string; serial?: string; brand?: string; model?: string; po?: string; from?: string; to?: string; assignee?: string; status?: string; reason?: string; brandModel?: string; page?: string }>;
}) {
  await requireRole(await requireAuth(), ["ADMIN", "MANAGER"]);
  const sp = await searchParams;

  const serial = sp.serial ?? "";
  const brand = sp.brand ?? "";
  const model = sp.model ?? "";
  const brandModel = sp.brandModel ?? "";
  const legacyQ = sp.q ?? "";

  const where: Record<string, unknown> = {
    type: "RETURN",
  };
  // Model-level filters (type / category / serial / brand / model / po) apply
  // to the RETURNED ITEM — delegated to Prisma on the item relation.
  const itemAnds: Record<string, unknown>[] = [];
  // Only items CURRENTLY in a returned state. An item can be returned, then
  // RELEASED again (returnItem → releaseItem allows release from RETURNED_KEEP),
  // which leaves a stale RETURN txn in history. The report must show only items
  // that are still returned right now — same invariant as the Released report
  // (only items currently RELEASED).
  itemAnds.push({ item: { status: { in: ["RETURNED_KEEP", "IN_REPAIR", "PLAN_DISPOSE"] } } });
  if (sp.type && sp.type !== "All") itemAnds.push({ item: { model: { type: sp.type } } });
  if (sp.category && sp.category !== "All") itemAnds.push({ item: { model: { category: sp.category } } });
  if (serial) itemAnds.push({ item: { serialNumber: { equals: serial } } });
  if (brand) itemAnds.push({ item: { model: { brand: { contains: brand } } } });
  if (model) itemAnds.push({ item: { model: { model: { contains: model } } } });
  if (brandModel) itemAnds.push({ item: { model: { OR: [{ brand: { contains: brandModel } }, { model: { contains: brandModel } }] } } });
  if (sp.po) itemAnds.push({ item: { poNumber: { contains: sp.po } } });
  if (legacyQ) {
    // Backward-compat ?q= → OR across serial / brand / model
    where.OR = [
      { item: { serialNumber: { contains: legacyQ } } },
      { item: { model: { model: { contains: legacyQ } } } },
      { item: { model: { brand: { contains: legacyQ } } } },
    ];
  }
  if (itemAnds.length) where.AND = itemAnds;

  const PAGE_SIZE = 30;
  const page = Math.max(1, Number(sp.page) || 1);

  // Fetch ALL matching RETURN txns + item details, then filter the
  // txn-level fields (status / returning PIC / return date) in JS and
  // paginate in memory — same pattern as the Released report.
  const rawTxns = await prisma.itemTxn.findMany({
    where,
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      statusAfter: true,
      returningPicName: true,
      returnReason: true,
      remarks: true,
      item: {
        select: {
          serialNumber: true,
          poNumber: true,
          location: true,
          dateReceived: true,
          hostname: true,
          model: { select: { type: true, brand: true, model: true, category: true } },
        },
      },
    },
  });

  const matches = (t: (typeof rawTxns)[number]) => {
    if (sp.status && t.statusAfter !== sp.status) return false;
    if (sp.assignee) {
      // Match the visible two-line cell: emp no (before "—") OR name (after).
      const raw = t.returningPicName ?? "";
      const parts = raw.split(/[—–-]/);
      const emp = (parts[0] ?? "").trim();
      const name = (parts[1] ?? "").trim();
      const q = sp.assignee.toLowerCase();
      if (!emp.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) return false;
    }
    if (sp.reason) {
      const r = (t.returnReason ?? "").toLowerCase();
      if (!r.includes(sp.reason.toLowerCase())) return false;
    }
    if (sp.from && t.date < new Date(sp.from)) return false;
    if (sp.to) {
      const end = new Date(`${sp.to}T23:59:59.999`);
      if (t.date > end) return false;
    }
    return true;
  };

  const filtered = rawTxns.filter(matches);

  // One row per SERIAL NUMBER — the LATEST RETURN txn wins. The seed data
  // contains repeated RETURN txns for the same item (e.g. MOS001 returned 3×),
  // which made the serial filter look "broken" (many rows for one serial).
  // Deduplicating keeps the invariant: 1 serial in the filter → 1 row out.
  const latestBySerial = new Map<string, (typeof rawTxns)[number]>();
  for (const t of filtered) {
    const key = t.item.serialNumber;
    const cur = latestBySerial.get(key);
    if (!cur || t.date > cur.date) latestBySerial.set(key, t);
  }
  const deduped = [...latestBySerial.values()];

  const totalRows = deduped.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const pageTxns = deduped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Map to the row shape the table expects (1 item per RETURN txn).
  const items = pageTxns.map((t) => ({
    serialNumber: t.item.serialNumber,
    poNumber: t.item.poNumber,
    location: t.item.location,
    dateReceived: t.item.dateReceived,
    hostname: t.item.hostname,
    model: t.item.model,
    transactions: [
      {
        id: t.id,
        date: t.date,
        statusAfter: t.statusAfter,
        returningPicName: t.returningPicName,
        returnReason: t.returnReason,
        remarks: t.remarks,
      },
    ],
  }));

  const filter = {
    type: sp.type ?? "",
    category: sp.category ?? "",
    serial: sp.serial ?? "",
    brand: sp.brand ?? "",
    model: sp.model ?? "",
    q: sp.q ?? "",
    po: sp.po ?? "",
    from: sp.from ?? "",
    to: sp.to ?? "",
    assignee: sp.assignee ?? "",
    status: sp.status ?? "",
    reason: sp.reason ?? "",
    brandModel: sp.brandModel ?? "",
  };
  const query = new URLSearchParams();
  if (filter.type) query.set("type", filter.type);
  if (filter.category) query.set("category", filter.category);
  if (filter.serial) query.set("serial", filter.serial);
  if (filter.brand) query.set("brand", filter.brand);
  if (filter.model) query.set("model", filter.model);
  if (filter.q) query.set("q", filter.q);
  if (filter.po) query.set("po", filter.po);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  if (filter.assignee) query.set("assignee", filter.assignee);
  if (filter.status) query.set("status", filter.status);
  if (filter.reason) query.set("reason", filter.reason);
  if (filter.brandModel) query.set("brandModel", filter.brandModel);
  const queryStr = query.toString();

  return (
    <div className="page-fill-height">
      <PageHeader
        title="Returned Item"
        subtitle="Items returned by users"
        align="center"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14l-4-4 4-4" className="animate-return-nudge" style={{ transformOrigin: "7px 12px" }} />
            <path d="M5 10h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3" />
          </svg>
        }
      />

      <ReturnedItemsTable
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
