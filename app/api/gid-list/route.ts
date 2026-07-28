import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const records = await prisma.gidList.findMany({
    where: { isDeleted: false },
    select: { employeeNo: true, name: true, globalId: true, email: true },
    orderBy: { employeeNo: "asc" },
  });

  return NextResponse.json({ ok: true, records });
}
