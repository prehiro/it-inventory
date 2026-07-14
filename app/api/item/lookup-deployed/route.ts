import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  await requireAuth();
  const serial = req.nextUrl.searchParams.get("serial")?.trim();
  if (!serial) return NextResponse.json({ error: "Serial required" }, { status: 400 });

  const item = await prisma.item.findFirst({
    where: { serialNumber: serial, isDeleted: false },
    include: { model: { select: { type: true, brand: true, model: true } } },
  });

  if (!item) {
    return NextResponse.json({ found: false, reason: "Serial not found" }, { status: 404 });
  }
  if (item.status !== "DEPLOYED") {
    return NextResponse.json(
      { found: false, reason: `Item is ${item.status}, not released` },
      { status: 409 },
    );
  }

  const releaseTxn = await prisma.itemTxn.findFirst({
    where: { itemId: item.id, type: "RELEASE" },
    orderBy: { date: "desc" },
    select: { assigneeEmpNumber: true, assigneeName: true, assigneeDept: true, date: true },
  });

  return NextResponse.json({
    found: true,
    item: {
      id: item.id,
      serialNumber: item.serialNumber,
      type: item.model.type,
      brand: item.model.brand,
      model: item.model.model,
      location: item.location,
      status: item.status,
      assigneeEmpNumber: releaseTxn?.assigneeEmpNumber ?? null,
      assigneeName: releaseTxn?.assigneeName ?? null,
      assigneeDept: releaseTxn?.assigneeDept ?? null,
      releasedAt: releaseTxn?.date ?? null,
    },
  });
}
