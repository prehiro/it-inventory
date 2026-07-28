/**
 * Seed GidList from the HR XLSX file.
 * Run: npx tsx scripts/seed-gidlist.ts
 *
 * Upserts: existing records updated, new records inserted.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import * as XLSX from "xlsx";

const adapter = new PrismaMssql(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = process.argv[2] ?? "/home/hiro/Downloads/gid_list.xlsx";
  const workbook = XLSX.readFile(filePath);
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

  console.log(`Done. Inserted: ${inserted}, Updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
