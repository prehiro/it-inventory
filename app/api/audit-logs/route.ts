import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const action = searchParams.get("action") || "";
  const q = searchParams.get("q") || "";
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (q) {
    where.OR = [
      { details: { contains: q } },
      { user: { name: { contains: q } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as any,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where: where as any }),
  ]);

  // Gather distinct actions for the filter UI
  const actions = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { action: true },
    orderBy: { _count: { action: "desc" } },
  });

  return NextResponse.json({
    ok: true,
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp.toISOString(),
      user: l.user.name,
    })),
    actions: actions.map((a) => ({ action: a.action, count: a._count.action })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
