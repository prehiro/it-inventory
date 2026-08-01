"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { statusLabel } from "@/lib/types";

export type ExportResult = { ok: true; data: string; filename: string } | { ok: false; error: string };

/* ──────────────────────────────────────────
   Palette & helpers
   ────────────────────────────────────────── */
const C = {
  blue: "2563EB",
  blueDark: "1E40AF",
  blueLight: "DBEAFE",
  slate: "64748B",
  slateLight: "F1F5F9",
  emerald: "10B981",
  emeraldLight: "D1FAE5",
  indigo: "6366F1",
  indigoLight: "E0E7FF",
  amber: "F59E0B",
  amberLight: "FEF3C7",
  rose: "F43F5E",
  roseLight: "FFE4E6",
  white: "FFFFFF",
  black: "0F172A",
  border: "E2E8F0",
};

/* ──────────────────────────────────────────
   Data loading — shared by excel & pdf
   ────────────────────────────────────────── */
async function loadTxns(f: Record<string, unknown>) {
  const where: Prisma.ItemTxnWhereInput = {};
  if (f.type) where.type = f.type as string;
  if (f.status) where.statusAfter = f.status as string;
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

/* ──────────────────────────────────────────
   Excel export — executive-grade styling (exceljs)
   ────────────────────────────────────────── */
export async function exportExcelAction(filter: Record<string, unknown>): Promise<ExportResult> {
  const s = await auth();
  if (!s?.user) return { ok: false, error: "Unauthorized" };
  if (s.user.role === "OPERATOR") return { ok: false, error: "Forbidden" };
  try {
    const txns = await loadTxns(filter);

    const typeLabel: Record<string, string> = { RECEIVE: "Received", RELEASE: "Released", RETURN: "Returned" };
    const typeCounts = txns.reduce<Record<string, number>>((acc, t) => {
      acc[t.type] = (acc[t.type] ?? 0) + 1;
      return acc;
    }, {});
    const statusCounts = txns.reduce<Record<string, number>>((acc, t) => {
      acc[t.statusAfter] = (acc[t.statusAfter] ?? 0) + 1;
      return acc;
    }, {});

    const wb = new ExcelJS.Workbook();
    wb.creator = "IT Inventory";
    wb.created = new Date();
    const ws = wb.addWorksheet("Movement Report", {
      views: [{ state: "frozen", ySplit: 8 }],
      properties: { defaultRowHeight: 18 },
    });

    ws.columns = [
      { key: "date", width: 15 },
      { key: "type", width: 13 },
      { key: "serial", width: 24 },
      { key: "status", width: 17 },
      { key: "operator", width: 20 },
      { key: "details", width: 34 },
    ];

    const thin = { style: "thin" as const, color: { argb: "FF" + C.border } };
    const mediumBlue = { style: "medium" as const, color: { argb: "FF" + C.blueDark } };

    /* ── Row 1: title band ── */
    const rTitle = ws.getRow(1);
    rTitle.height = 30;
    const titleCell = rTitle.getCell(1);
    titleCell.value = "IT INVENTORY";
    titleCell.font = { bold: true, size: 20, color: { argb: "FF" + C.white } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C.blue } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    for (let c = 2; c <= 6; c++) {
      const cell = rTitle.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C.blue } };
    }

    /* ── Row 2: subtitle ── */
    const rSub = ws.getRow(2);
    rSub.height = 20;
    const subCell = rSub.getCell(1);
    subCell.value = "Item Movement History  ·  Executives Summary";
    subCell.font = { italic: true, size: 10, color: { argb: "FF" + C.slate } };

    /* ── Row 3: filter summary ── */
    const parts: string[] = [];
    if (filter.type) parts.push(`Type: ${typeLabel[filter.type as string] ?? filter.type}`);
    if (filter.status) parts.push(`Status: ${statusLabel(filter.status as string)}`);
    if (filter.from) parts.push(`From: ${filter.from}`);
    if (filter.to) parts.push(`To: ${filter.to}`);
    const filterStr = parts.length ? parts.join("   ·   ") : "All transactions";
    const rFilter = ws.getRow(3);
    const filterCell = rFilter.getCell(1);
    filterCell.value = `Filter: ${filterStr}`;
    filterCell.font = { size: 10, color: { argb: "FF" + C.slate } };

    /* ── Row 4: spacer ── */
    ws.getRow(4).height = 6;

    /* ── Row 5: stat chips ── */
    const chips: { label: string; value: number; bg: string; fg: string }[] = [
      { label: "TOTAL", value: txns.length, bg: C.blueLight, fg: C.blue },
      { label: "RECEIVED", value: typeCounts.RECEIVE ?? 0, bg: C.emeraldLight, fg: C.emerald },
      { label: "RELEASED", value: typeCounts.RELEASE ?? 0, bg: C.indigoLight, fg: C.indigo },
      { label: "RETURNED", value: typeCounts.RETURN ?? 0, bg: C.slateLight, fg: C.slate },
      { label: "PLAN DISPOSE", value: statusCounts.PLAN_DISPOSE ?? 0, bg: C.roseLight, fg: C.rose },
    ];
    const rChip = ws.getRow(5);
    rChip.height = 40;
    chips.forEach((chip, i) => {
      const cell = rChip.getCell(i + 1);
      cell.value = chip.label;
      cell.font = { bold: true, size: 9, color: { argb: "FF" + chip.fg } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + chip.bg } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { top: thin, bottom: thin, left: thin, right: thin };
    });

    /* ── Row 6: chip values ── */
    const rChipVal = ws.getRow(6);
    rChipVal.height = 30;
    chips.forEach((chip, i) => {
      const cell = rChipVal.getCell(i + 1);
      cell.value = chip.value;
      cell.font = { bold: true, size: 16, color: { argb: "FF" + chip.fg } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + chip.bg } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { top: thin, bottom: thin, left: thin, right: thin };
    });

    /* ── Row 7: spacer ── */
    ws.getRow(7).height = 6;

    /* ── Row 8: table header (frozen) ── */
    const rHead = ws.getRow(8);
    rHead.height = 22;
    const HEADERS = ["DATE", "TYPE", "SERIAL NUMBER", "STATUS", "OPERATOR", "DETAILS"];
    HEADERS.forEach((h, i) => {
      const cell = rHead.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: "FF" + C.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C.blue } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = { top: mediumBlue, bottom: mediumBlue, left: mediumBlue, right: mediumBlue };
    });

    /* ── Data rows (zebra) ── */
    const STATUS_STYLE: Record<string, { fg: string; bg: string }> = {
      AVAILABLE: { fg: C.emerald, bg: C.emeraldLight },
      RELEASED: { fg: C.indigo, bg: C.indigoLight },
      DEPLOYED: { fg: C.indigo, bg: C.indigoLight },
      RETURNED_KEEP: { fg: C.slate, bg: C.slateLight },
      IN_REPAIR: { fg: C.amber, bg: C.amberLight },
      PLAN_DISPOSE: { fg: C.rose, bg: C.roseLight },
      DISPOSED: { fg: C.rose, bg: C.roseLight },
    };
    const TYPE_STYLE: Record<string, { fg: string; bg: string }> = {
      RECEIVE: { fg: C.emerald, bg: C.emeraldLight },
      RELEASE: { fg: C.indigo, bg: C.indigoLight },
      RETURN: { fg: C.slate, bg: C.slateLight },
    };
    txns.forEach((t, i) => {
      const r = 9 + i;
      const row = ws.getRow(r);
      row.height = 20;
      const zebra = i % 2 === 0 ? C.white : C.slateLight;
      const details: string =
        t.type === "RECEIVE" ? (t.remarks ?? "") :
        t.type === "RELEASE" ? (t.assigneeName ?? "") :
        (t.returningPicName ?? "");
      const vals = [
        t.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        typeLabel[t.type] ?? t.type,
        t.item.serialNumber,
        statusLabel(t.statusAfter),
        t.operator.name,
        details,
      ];
      const typeSty = TYPE_STYLE[t.type] ?? { fg: C.slate, bg: C.slateLight };
      const statusSty = STATUS_STYLE[t.statusAfter] ?? { fg: C.slate, bg: C.slateLight };
      vals.forEach((v, c) => {
        const cell = row.getCell(c + 1);
        cell.value = v;
        cell.font = { size: 10, color: { argb: "FF" + C.black } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + zebra } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = { top: thin, bottom: thin, left: thin, right: thin };
      });
      // Column 2: TYPE — colored chip
      const tc = row.getCell(2);
      tc.font = { size: 10, bold: true, color: { argb: "FF" + typeSty.fg } };
      tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + typeSty.bg } };
      tc.alignment = { vertical: "middle", horizontal: "center" };
      // Column 4: STATUS — colored badge (matches app StatusBadge)
      const sc = row.getCell(4);
      sc.font = { size: 10, bold: true, color: { argb: "FF" + statusSty.fg } };
      sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + statusSty.bg } };
      sc.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Freeze + autofilter
    ws.views = [{ state: "frozen", ySplit: 8 }];
    ws.autoFilter = { from: "A8", to: `F${8 + txns.length}` };

    // A4 fit-to-width: all columns fit on one landscape A4 page (height scales)
    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      horizontalCentered: true,
    };

    const buf = await wb.xlsx.writeBuffer();
    return { ok: true, data: Buffer.from(buf).toString("base64"), filename: "it-inventory-movement-report.xlsx" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
