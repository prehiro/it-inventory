/* Verify the Available-stock workbook layout without touching the DB:
   row 1 title, row 2 subtitle, row 3 filter, row 4 spacer, row 5 header,
   rows 6.. data, footer = generation stamp only (no count row). */
import ExcelJS from "exceljs";
import { buildAvailableStockWorkbook, loadAvailableStock } from "../app/actions/export";

async function main() {
  const items = [
    { serialNumber: "ABC123", status: "AVAILABLE", poNumber: "PO-1", location: "IT Store", dateReceived: new Date("2026-07-28"), model: { type: "PC", brand: "DELL", model: "OPTIPLEX 7010", category: "NCA" } },
    { serialNumber: "XYZ999", status: "AVAILABLE", poNumber: "PO-2", location: "IT Store", dateReceived: new Date("2026-07-29"), model: { type: "Laptop", brand: "LENOVO", model: "T14", category: "FA" } },
    { serialNumber: "QWE777", status: "AVAILABLE", poNumber: "PO-3", location: "IT Store", dateReceived: new Date("2026-07-30"), model: { type: "Printer", brand: "SATO", model: "CL4NX", category: "GENERAL" } },
  ] as Awaited<ReturnType<typeof loadAvailableStock>>;

  const res = await buildAvailableStockWorkbook(items, {
    sheetTitle: "Received Item",
    subtitle: "Available & ready-to-release inventory",
    filename: "verify.xlsx",
  });
  if (!res.ok) throw new Error(res.error);

  const wb = new ExcelJS.Workbook();
  const buf = Buffer.from(res.data, "base64");
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const ws = wb.getWorksheet("Received Item");
  if (!ws) throw new Error("sheet missing");

  const rows: { r: number; cells: (string | number | undefined)[] }[] = [];
  ws.eachRow((row, rn) => {
    const vals: (string | number | undefined)[] = [];
    for (let c = 1; c <= 10; c++) {
      const v = row.getCell(c).value;
      vals.push(typeof v === "object" && v !== null && "text" in v ? (v as { text: string }).text : (v as string | number | undefined));
    }
    // trim trailing empties
    while (vals.length && (vals[vals.length - 1] === undefined || vals[vals.length - 1] === "")) vals.pop();
    rows.push({ r: rn, cells: vals });
  });

  console.log("TOTAL ROWS:", rows.length);
  for (const r of rows) console.log(`R${String(r.r).padStart(2)}:`, JSON.stringify(r.cells));
  console.log("FROZEN:", JSON.stringify(ws.views));
  console.log("AUTOFILTER:", JSON.stringify(ws.autoFilter));
  console.log("COL COUNT:", ws.columnCount);
  console.log("ROW COUNT:", ws.rowCount);
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
