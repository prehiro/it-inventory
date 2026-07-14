import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { HOSTNAME_TYPES, statusLabel } from "@/lib/types";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET() {
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
      status: statusLabel(it.status),
    };
  });
  rows.sort((a, b) => {
    if (a.section < b.section) return -1;
    if (a.section > b.section) return 1;
    return a.serialNumber.localeCompare(b.serialNumber);
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("PC Ledger");
  ws.columns = [
    { header: "Emp Number", key: "empNumber", width: 14 },
    { header: "PIC Name", key: "picName", width: 22 },
    { header: "GID", key: "gid", width: 14 },
    { header: "Email", key: "email", width: 26 },
    { header: "Hostname", key: "hostname", width: 18 },
    { header: "SN", key: "serialNumber", width: 18 },
    { header: "Type", key: "type", width: 12 },
    { header: "Brand", key: "brand", width: 14 },
    { header: "Model", key: "model", width: 20 },
    { header: "Section", key: "section", width: 18 },
    { header: "Remarks", key: "remarks", width: 28 },
    { header: "Status", key: "status", width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  rows.forEach((r) => ws.addRow(r));

  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pc-ledger-${stamp}.xlsx"`,
    },
  });
}
