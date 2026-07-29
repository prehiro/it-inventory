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
    <div
      className="relative"
      style={{
        width: "calc(100vw - 15rem - 0.5rem)",
        left: "calc(-50vw + 50% + 21rem)",
      }}
    >
      <PageHeader
        title="PC Ledger"
        subtitle="PC, Laptop & Tablet inventory with PIC, hostname and deployment info"
        align="center"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 9h8" className="animate-ledger-pulse" />
            <path d="M8 13h8" className="animate-ledger-pulse" style={{ animationDelay: "0.6s" }} />
            <path d="M8 17h5" className="animate-ledger-pulse" style={{ animationDelay: "1.2s" }} />
          </svg>
        }
      />
      <LedgerTable rows={rows} />
    </div>
  );
}
