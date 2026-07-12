"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  receiveItem,
  releaseItem,
  returnItem,
  receiveBatch,
  type BatchResult,
} from "@/lib/inventory";
import {
  receiveSchema,
  releaseSchema,
  returnSchema,
  batchReceiveSchema,
} from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };
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
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
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
    await releaseItem(parsed.data, session.user.id);
    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function returnAction(
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const parsed = returnSchema.safeParse(data);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await returnItem(parsed.data, session.user.id);
    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true };
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
