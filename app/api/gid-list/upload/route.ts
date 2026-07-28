import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" });

    const buf = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buf, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

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
