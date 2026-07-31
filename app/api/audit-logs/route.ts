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
  if (action) {
    const actions = action.split(",").map((s) => s.trim()).filter(Boolean);
    if (actions.length === 1) where.action = actions[0];
    else if (actions.length > 1) where.action = { in: actions };
  }
  if (q) {
    where.OR = [
      { details: { contains: q } },
      { user: { name: { contains: q } } },
    ];
  }
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    const tsWhere: Record<string, unknown> = {};
    if (from) tsWhere.gte = new Date(from);
    if (to) tsWhere.lte = new Date(`${to}T23:59:59.999Z`);
    where.timestamp = tsWhere;
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

  // Gather distinct actions for the filter UI.
  // Deliberately NOT filtered by the action filter itself, so every pill
  // stays visible no matter which filter is active (counts still respect q/date).
  const pillWhere = { ...where };
  delete pillWhere.action;
  const [actions, allTotal] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ["action"],
      where: pillWhere as any,
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
    }),
    prisma.auditLog.count({ where: pillWhere as any }),
  ]);

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
    allTotal,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
