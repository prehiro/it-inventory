import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { HOSTNAME_TYPES } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { LedgerTable } from "./ledger-table";

export const dynamic = "force-dynamic";

export default async function PcLedgerPage() {
  await requireAuth();

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

  const rows = items.map((it) => {
    const txn = it.transactions[0] ?? null;
    const section = it.status === "AVAILABLE" ? "Unassigned" : (txn?.assigneeDept || "Unassigned");
    return {
      empNumber: it.status === "AVAILABLE" ? "Unassigned" : (txn?.assigneeEmpNumber ?? "Unassigned"),
      picName: it.status === "AVAILABLE" ? "Unassigned" : (txn?.assigneeName ?? "Unassigned"),
      gid: txn?.gid ?? "—",
      email: txn?.email ?? "—",
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
    <div className="max-w-7xl">
      <PageHeader
        title="PC Ledger"
        subtitle="PC, Laptop & Tablet inventory with PIC, hostname and deployment info"
      />
      <LedgerTable rows={rows} />
    </div>
  );
}
