import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" });

    const buf = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    const rows: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const vals = row.values as unknown[];
      rows.push({
        "Employee No": vals[1] ?? "",
        "Alphabet Name": vals[2] ?? "",
        "Global ID": vals[3] ?? "",
        "E-mail Address": vals[4] ?? "",
      });
    });

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const employeeNo = String(row["Employee No"] ?? "").trim();
      const name = String(row["Alphabet Name"] ?? "").trim();
      const globalId = String(row["Global ID"] ?? "").trim();
      const email = String(row["E-mail Address"] ?? "").trim();

      if (!employeeNo || !name) continue;

      const existing = await prisma.gidList.findUnique({ where: { employeeNo } });
      if (existing) {
        await prisma.gidList.update({
          where: { employeeNo },
          data: { name, globalId, email },
        });
        updated++;
      } else {
        await prisma.gidList.create({
          data: { employeeNo, name, globalId, email },
        });
        inserted++;
      }
    }

    return NextResponse.json({ ok: true, inserted, updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
