import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { HOSTNAME_TYPES } from "@/lib/types";
import { LedgerTable } from "./ledger-table";

export const dynamic = "force-dynamic";

export default async function PcLedgerPage() {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  const items = await prisma.item.findMany({
    where: {
      isDeleted: false,
      model: { type: { in: HOSTNAME_TYPES } },
    },
    include: {
      model: true,
      transactions: {
        where: { type: "RELEASE" },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  // Existing sections for the edit-row dropdown (distinct assigneeDept on RELEASE txns)
  const sectionRows = await prisma.itemTxn.findMany({
    where: { type: "RELEASE", assigneeDept: { not: null } },
    select: { assigneeDept: true },
    distinct: ["assigneeDept"],
  });
  const sections = sectionRows
    .map((s) => s.assigneeDept as string)
    .sort((a, b) => a.localeCompare(b));

  const rows = items.map((it) => {
    const txn = it.transactions[0] ?? null;
    const isAvailable = it.status === "AVAILABLE";
    const section = isAvailable ? "Unassigned" : (txn?.assigneeDept || "Unassigned");
    return {
      id: it.id,
      empNumber: isAvailable ? "Unassigned" : (txn?.assigneeEmpNumber ?? "N/A"),
      picName: isAvailable ? "Unassigned" : (txn?.assigneeName ?? "N/A"),
      gid: txn?.gid ?? "—",
      email: isAvailable ? "—" : (txn?.email ?? "N/A"),
      hostname: it.hostname,
      serialNumber: it.serialNumber,
      type: it.model.type,
      brand: it.model.brand,
      model: it.model.model,
      section,
      remarks: it.remarks || "—",
      status: it.status,
    };
  });

  rows.sort((a, b) => {
    if (a.section < b.section) return -1;
    if (a.section > b.section) return 1;
    return a.serialNumber.localeCompare(b.serialNumber);
  });

  return (
    <div className="pc-ledger-full">
      <LedgerTable rows={rows} isAdmin={isAdmin} sections={sections} />
    </div>
  );
}
