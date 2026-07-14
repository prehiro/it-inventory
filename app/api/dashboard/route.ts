import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [total, available, deployed, returned, models, recent] =
    await Promise.all([
      prisma.item.count({ where: { isDeleted: false } }),
      prisma.item.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
      prisma.item.count({ where: { isDeleted: false, status: "RELEASED" } }),
      prisma.item.count({ where: { isDeleted: false, status: "RETURNED_KEEP" } }),
      prisma.itemModel.count({ where: { isDeleted: false } }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
    ]);

  return NextResponse.json({
    metrics: { total, available, deployed, returned, models },
    recentActivity: recent.map((r) => ({
      id: r.id,
      action: r.action,
      details: r.details,
      timestamp: r.timestamp,
      user: r.user.name,
    })),
  });
}
