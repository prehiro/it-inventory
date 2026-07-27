import { NextRequest, NextResponse } from "next/server";
import { repairRestoreAction } from "@/app/actions/inventory";

export async function POST(req: NextRequest) {
  const data: { itemId: string } = await req.json();
  const result = await repairRestoreAction(data);
  return NextResponse.json(result);
}
