import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const users = await prisma.systemUser.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: { employeeNumber: true, name: true, department: true, role: true },
  });

  return NextResponse.json({ ok: true, users });
}
