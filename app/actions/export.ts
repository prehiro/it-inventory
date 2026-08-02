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
  purple: "7C3AED",
  purpleLight: "EDE9FE",
  sky: "0284C7",
  skyLight: "E0F2FE",
  rose: "F43F5E",
  roseLight: "FFE4E6",
  white: "FFFFFF",
  black: "0F172A",
  border: "E2E8F0",
};

/* ──────────────────────────────────────────
   Data loading — movement transactions
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
   Excel export — Movement History (executive-grade styling)
   ────────────────────────────────────────── */
export async function exportExcelAction(filter: Record<string, unknown>): Promise<ExportResult> {
  const s = await auth();
  if (!s?.user) return { ok: false, error: "Unauthorized" };
  if (s.user.role === "OPERATOR") return { ok: false, error: "Forbidden" };
  try {
    const txns = await loadTxns(filter);

    const typeLabel: Record<string, string> = { RECEIVE: "Received", RELEASE: "Released", RETURN: "Returned" };

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

    /* ── Row 5: table header (frozen) ── */
    const rHead = ws.getRow(5);
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
      const r = 6 + i;
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

/* ──────────────────────────────────────────
   Available stock export — ready-to-release inventory (exceljs)
   Used by Received Item & Released Item report pages
   ────────────────────────────────────────── */
export async function exportAvailableStockAction(filter: Record<string, unknown>): Promise<ExportResult> {
  const s = await auth();
  if (!s?.user) return { ok: false, error: "Unauthorized" };
  if (s.user.role === "OPERATOR") return { ok: false, error: "Forbidden" };
  try {
    const items = await loadAvailableStock(filter);
    return await buildAvailableStockWorkbook(items, filter);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Shared loader for the Available-stock export (same filters as report pages). */
export async function loadAvailableStock(filter: Record<string, unknown>) {
  // Build where from the same filters as the report pages
  const statuses = (filter.statuses as string[] | undefined) ?? ["AVAILABLE"];
  const where: Prisma.ItemWhereInput = { isDeleted: false, status: { in: statuses } };
  if (filter.type && filter.type !== "All") where.model = { type: filter.type as string };
  if (filter.category && filter.category !== "All") {
    where.model = { ...(where.model as object), category: filter.category as string };
  }
  if (filter.po) where.poNumber = { contains: filter.po as string };
  if (filter.location) where.location = { contains: filter.location as string };
  if (filter.q) {
    where.OR = [
      { serialNumber: { contains: filter.q as string } },
      { model: { model: { contains: filter.q as string } } },
      { model: { brand: { contains: filter.q as string } } },
    ];
  }
  if (filter.from || filter.to) {
    where.dateReceived = {};
    if (filter.from) (where.dateReceived as Record<string, unknown>).gte = new Date(filter.from as string);
    if (filter.to) (where.dateReceived as Record<string, unknown>).lte = new Date(filter.to as string);
  }

  return prisma.item.findMany({
    where,
    orderBy: [{ dateReceived: "desc" }, { serialNumber: "asc" }],
    select: {
      serialNumber: true,
      status: true,
      poNumber: true,
      location: true,
      dateReceived: true,
      model: { select: { type: true, brand: true, model: true, category: true } },
    },
  });
}

/** Build the workbook (pure — no auth, testable via npx tsx). */
export async function buildAvailableStockWorkbook(
  items: Awaited<ReturnType<typeof loadAvailableStock>>,
  filter: Record<string, unknown>,
): Promise<ExportResult> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "IT Inventory";
  wb.created = new Date();
  const sheetTitle = (filter.sheetTitle as string) ?? "Available Stock";
  const isReceived = sheetTitle === "Received Item";
  const band = isReceived ? "217346" : C.blue; // Excel brand green for Received
  const bandDark = isReceived ? "145A32" : C.blueDark;
  const ws = wb.addWorksheet(sheetTitle, {
    views: [{ state: "frozen", ySplit: 5 }],
    properties: { defaultRowHeight: 18 },
  });

  ws.columns = [
    { key: "no", width: 6 },
    { key: "serial", width: 24 },
    { key: "type", width: 12 },
    { key: "brand", width: 14 },
    { key: "model", width: 24 },
    { key: "category", width: 11 },
    { key: "po", width: 16 },
    { key: "location", width: 16 },
    { key: "received", width: 14 },
    { key: "status", width: 16 },
  ];

  const thin = { style: "thin" as const, color: { argb: "FF" + C.border } };
  const mediumBand = { style: "medium" as const, color: { argb: "FF" + bandDark } };

  /* ── Row 1: title band — main title kiri, subtitle + filter kanan (merged) ── */
  const rTitle = ws.getRow(1);
  rTitle.height = 44;
  const titleCell = rTitle.getCell(1);
  titleCell.value = isReceived ? "RECEIVED ITEM REPORT" : "IT INVENTORY";
  titleCell.font = { bold: true, size: 18, color: { argb: "FF" + C.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + band } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  for (let c = 2; c <= 10; c++) {
    const cell = rTitle.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + band } };
  }

  // Subtitle + filter summary, merged G1:J1, two lines, right-aligned on the band
  const parts: string[] = [];
  if (filter.type && filter.type !== "All") parts.push(`Type: ${filter.type}`);
  if (filter.category && filter.category !== "All") parts.push(`Category: ${filter.category}`);
  if (filter.po) parts.push(`PO: ${filter.po}`);
  if (filter.location) parts.push(`Location: ${filter.location}`);
  if (filter.q) parts.push(`Search: ${filter.q}`);
  if (filter.from) parts.push(`From: ${filter.from}`);
  if (filter.to) parts.push(`To: ${filter.to}`);
  const filterStr = parts.length ? parts.join("   ·   ") : "All items";
  const subtitle = (filter.subtitle as string) ?? "Available & ready-to-release inventory";
  ws.mergeCells(1, 7, 1, 10); // G1:J1
  const infoCell = rTitle.getCell(7);
  infoCell.value = `${subtitle}\nFilter: ${filterStr}`;
  infoCell.font = { italic: true, size: 9.5, color: { argb: "F5FFFFFF" } };
  infoCell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };

  /* ── Row 3: table header (frozen) ── */
  const rHead = ws.getRow(3);
  rHead.height = 22;
  const HEADERS = ["NO", "SERIAL NUMBER", "TYPE", "BRAND", "MODEL", "CATEGORY", "PO NUMBER", "LOCATION", "RECEIVED", "STATUS"];
  HEADERS.forEach((h, i) => {
    const cell = rHead.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: "FF" + C.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + band } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { top: mediumBand, bottom: mediumBand, left: mediumBand, right: mediumBand };
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
  const CAT_STYLE: Record<string, { fg: string; bg: string }> = {
    FA: { fg: C.amber, bg: C.amberLight },
    NCA: { fg: C.purple, bg: C.purpleLight },
    GENERAL: { fg: C.sky, bg: C.skyLight },
  };
  items.forEach((i, idx) => {
    const r = 4 + idx;
    const row = ws.getRow(r);
    row.height = 20;
    const zebra = idx % 2 === 0 ? C.white : C.slateLight;
    const vals = [
      idx + 1,
      i.serialNumber,
      i.model.type,
      i.model.brand,
      i.model.model,
      i.model.category,
      i.poNumber ?? "",
      i.location,
      i.dateReceived.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      statusLabel(i.status),
    ];
    const catSty = CAT_STYLE[i.model.category] ?? { fg: C.slate, bg: C.slateLight };
    const statusSty = STATUS_STYLE[i.status] ?? { fg: C.slate, bg: C.slateLight };
    vals.forEach((v, c) => {
      const cell = row.getCell(c + 1);
      cell.value = v;
      cell.font = { size: 10, color: { argb: "FF" + C.black } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + zebra } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = { top: thin, bottom: thin, left: thin, right: thin };
    });
    // Column 1: NO — centered
    const nc = row.getCell(1);
    nc.alignment = { vertical: "middle", horizontal: "center" };
    nc.font = { size: 10, color: { argb: "FF" + C.black } };
    // Column 6: CATEGORY — colored chip
    const cc = row.getCell(6);
    cc.font = { size: 10, bold: true, color: { argb: "FF" + catSty.fg } };
    cc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + catSty.bg } };
    cc.alignment = { vertical: "middle", horizontal: "center" };
    // Column 10: STATUS — colored badge
    const sc = row.getCell(10);
    sc.font = { size: 10, bold: true, color: { argb: "FF" + statusSty.fg } };
    sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + statusSty.bg } };
    sc.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Freeze + autofilter
  ws.views = [{ state: "frozen", ySplit: 5 }];
  ws.autoFilter = { from: "A5", to: `J${5 + items.length}` };

  /* ── Footer: generation stamp only (no item-count row) ── */
  const last = 6 + items.length;
  const rGen = ws.getRow(last + 1);
  rGen.height = 18;
  const genCell = rGen.getCell(1);
  genCell.value = `Generated by IT Inventory · ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  genCell.font = { italic: true, size: 9, color: { argb: "FF" + C.slate } };

  // A4 fit-to-width landscape
  ws.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    horizontalCentered: true,
  };

  const buf = await wb.xlsx.writeBuffer();
  return {
    ok: true,
    data: Buffer.from(buf).toString("base64"),
    filename: (filter.filename as string) ?? "it-inventory-available-stock.xlsx",
  };
}
