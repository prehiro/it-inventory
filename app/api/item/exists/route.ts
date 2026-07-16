import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

// Realtime duplicate check for the Single Receive form: returns whether a
// serial number already exists (any non-deleted item). Used to warn the user
// before they submit, so no Enter press is required.
export async function GET(req: NextRequest) {
  await requireAuth();
  const serial = req.nextUrl.searchParams.get("serial")?.trim();
  if (!serial) return NextResponse.json({ exists: false });

  const item = await prisma.item.findFirst({
    where: { serialNumber: serial, isDeleted: false },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!item });
}
