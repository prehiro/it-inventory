import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const raw = await prisma.itemModel.findMany({
    where: { isDeleted: false },
    include: {
      _count: { select: { items: { where: { isDeleted: false, status: "AVAILABLE" } } } },
    },
  });

  const items = raw
    .filter((m) => m._count.items <= 2)
    .map((m) => ({ brand: m.brand, model: m.model, available: m._count.items }));

  return NextResponse.json({ items });
}
