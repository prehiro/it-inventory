import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ found: false, reason: "Unauthorized" }, { status: 401 });

  const emp = req.nextUrl.searchParams.get("emp");
  if (!emp || emp.length < 3)
    return NextResponse.json({ found: false });

  const employee = await prisma.gidList.findFirst({
    where: {
      employeeNo: { contains: emp },
      isDeleted: false,
    },
    select: {
      employeeNo: true,
      name: true,
      globalId: true,
      email: true,
    },
  });

  if (!employee)
    return NextResponse.json({ found: false });

  return NextResponse.json({ found: true, data: employee });
}
