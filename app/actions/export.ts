"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { statusLabel } from "@/lib/types";

export type ExportResult = { ok: true; data: string; filename: string } | { ok: false; error: string };

async function loadTxns(f: Record<string, unknown>) {
  const where: Prisma.ItemTxnWhereInput = {};
  if (f.type) where.type = f.type as string;
  if (f.status) where.item = { status: f.status as string };
  if (f.from || f.to) {
    const date: { gte?: Date; lte?: Date } = {};
    if (f.from) date.gte = new Date(f.from as string);
    if (f.to) date.lte = new Date(f.to as string);
    where.date = date;
  }
  return prisma.itemTxn.findMany({
    where,
    orderBy: { date: "desc" },
    include: { item: { select: { serialNumber: true, status: true } }, operator: { select: { name: true } } },
  });
}

export async function exportExcelAction(filter: Record<string, unknown>): Promise<ExportResult> {
  const s = await auth();
  if (!s?.user) return { ok: false, error: "Unauthorized" };
  if (s.user.role === "OPERATOR") return { ok: false, error: "Forbidden" };
  try {
    const txns = await loadTxns(filter);
    const rows = txns.map((t) => ({
      Date: t.date.toISOString(),
      Type: t.type,
      Serial: t.item.serialNumber,
      Status: statusLabel(t.statusAfter),
      Operator: t.operator.name,
      Assignee: t.assigneeName ?? "",
      ReturningPIC: t.returningPicName ?? "",
      Remarks: t.remarks ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    return { ok: true, data: buf, filename: "inventory-report.xlsx" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function exportPdfAction(filter: Record<string, unknown>): Promise<ExportResult> {
  const s = await auth();
  if (!s?.user) return { ok: false, error: "Unauthorized" };
  if (s.user.role === "OPERATOR") return { ok: false, error: "Forbidden" };
  try {
    const txns = await loadTxns(filter);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("IT Inventory Report", 14, 18);
    doc.setFontSize(9);
    let y = 30;
    doc.text("Date | Type | Serial | Status | Operator", 14, y);
    y += 6;
    for (const t of txns.slice(0, 60)) {
      const line = `${t.date.toLocaleDateString()} | ${t.type} | ${t.item.serialNumber} | ${statusLabel(t.statusAfter)} | ${t.operator.name}`;
      doc.text(line.substring(0, 110), 14, y);
      y += 5;
      if (y > 280) { doc.addPage(); y = 18; }
    }
    const out = doc.output("arraybuffer");
    return { ok: true, data: Buffer.from(out).toString("base64"), filename: "inventory-report.pdf" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
