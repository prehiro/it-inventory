// One-off seed: creates the first ADMIN user.
// Run with:  npx tsx scripts/seed-admin.ts   (or node --loader)
// Edit the values below before running.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const ADMIN = {
  employeeNumber: "ADM001",
  name: "Administrator",
  department: "IT",
  password: "Admin@12345",
};

async function main() {
  const existing = await prisma.systemUser.findUnique({
    where: { employeeNumber: ADMIN.employeeNumber },
  });
  if (existing) {
    console.log("Admin already exists:", ADMIN.employeeNumber);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN.password, 10);
  await prisma.systemUser.create({
    data: {
      employeeNumber: ADMIN.employeeNumber,
      name: ADMIN.name,
      department: ADMIN.department,
      role: "ADMIN",
      passwordHash,
    },
  });
  console.log("Admin created:", ADMIN.employeeNumber, "password:", ADMIN.password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
