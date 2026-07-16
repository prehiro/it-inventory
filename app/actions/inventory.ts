"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  receiveItem,
  releaseItem,
  returnItem,
  receiveBatch,
  isDuplicateSerialError,
  type BatchResult,
} from "@/lib/inventory";
import {
  receiveSchema,
  releaseSchema,
  returnSchema,
  batchReceiveSchema,
} from "@/lib/validation";

export type ActionResult = { ok: true; releasedAt?: string; txnAt?: string } | { ok: false; error: string; duplicateSerial?: boolean };
export type BatchActionResult =
  | { ok: true; results: BatchResult[] }
  | { ok: false; error: string };

export async function receiveAction(
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const parsed = receiveSchema.safeParse(data);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await receiveItem(parsed.data, session.user.id);
    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    const dup = isDuplicateSerialError(e);
    return {
      ok: false,
      error: dup ? "Serial Number already exists" : (e instanceof Error ? e.message : "Failed to receive item"),
      duplicateSerial: dup,
    };
  }
}

export async function releaseAction(
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const parsed = releaseSchema.safeParse(data);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const result = await releaseItem(parsed.data, session.user.id);
    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/release");
    revalidatePath("/pc-ledger");
    return { ok: true, releasedAt: result.date.toISOString() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function returnAction(
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const emp = String(data.assigneeEmpNumber ?? "").trim();
  const name = String(data.assigneeName ?? "").trim();
  const payload: Record<string, unknown> = {
    ...data,
    returningPicName: [emp, name].filter(Boolean).join(" — "),
  };

  const parsed = returnSchema.safeParse(payload);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const result = await returnItem(parsed.data, session.user.id);
    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true, txnAt: result.date.toISOString() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function receiveBatchAction(
  data: Record<string, unknown>,
): Promise<BatchActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const parsed = batchReceiveSchema.safeParse(data);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const serials = parsed.data.lines.map((l) => l.trim()).filter((s): s is string => !!s);
    const results = await receiveBatch(
      {
        modelId: parsed.data.modelId,
        poNumber: parsed.data.poNumber,
        location: parsed.data.location,
        remarks: parsed.data.remarks,
        serials,
      },
      session.user.id,
    );
    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true, results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
