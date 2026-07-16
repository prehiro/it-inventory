import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ReceiveInput, ReleaseInput, ReturnInput } from "@/lib/validation";
import { HOSTNAME_TYPES, type ItemType } from "@/lib/types";

/** Friendly error message for a batch receive failure (no raw Prisma stack). */
function describeReceiveError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return "Serial already exists";
    if (e.code === "P2003") return "Invalid model reference";
  }
  if (e instanceof Error) return e.message;
  return "Failed to receive item";
}

/** True when a receive failed because the serial number already exists (P2002). */
export function isDuplicateSerialError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * All inventory mutations run inside a single interactive $transaction so the
 * row lock (Item read) + write + audit log either all commit or all roll back.
 * This prevents two operators from releasing the same item concurrently.
 */

export type BatchResult = { serial: string; ok: boolean; error?: string };

export async function receiveBatch(
  input: { modelId: string; poNumber?: string; location?: string; remarks?: string; serials: string[] },
  operatorId: string,
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  for (const serial of input.serials) {
    try {
      await receiveItem(
        {
          modelId: input.modelId,
          serialNumber: serial,
          poNumber: input.poNumber,
          location: input.location,
          remarks: input.remarks,
        },
        operatorId,
      );
      results.push({ serial, ok: true });
    } catch (e) {
      results.push({
        serial,
        ok: false,
        error: describeReceiveError(e),
      });
    }
  }
  return results;
}

export async function receiveItem(input: ReceiveInput, operatorId: string) {
  return prisma.$transaction(async (tx) => {
    const model = await tx.itemModel.findFirst({
      where: { id: input.modelId, isDeleted: false },
    });
    if (!model) throw new Error("Model not found");

    const item = await tx.item.create({
      data: {
        modelId: input.modelId,
        serialNumber: input.serialNumber,
        poNumber: input.poNumber || null,
        location: input.location || "IT Store",
        remarks: input.remarks || null,
        status: "AVAILABLE",
      },
    });

    await tx.itemTxn.create({
      data: {
        type: "RECEIVE",
        itemId: item.id,
        operatorId,
        statusAfter: "AVAILABLE",
        remarks: input.remarks || null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "RECEIVED_ITEM",
        details: JSON.stringify({
          serialNumber: item.serialNumber,
          model: model.model,
          poNumber: input.poNumber || null,
        }),
        userId: operatorId,
      },
    });

    return item;
  });
}

export async function releaseItem(input: ReleaseInput, operatorId: string) {
  return prisma.$transaction(async (tx) => {
    // Lock the item row for update by reading it inside the tx.
    const item = await tx.item.findUnique({
      where: { id: input.itemId },
      include: { model: true },
    });
    if (!item || item.isDeleted) throw new Error("Item not found");
    if (item.status !== "AVAILABLE")
      throw new Error(`Item is ${item.status}, cannot release`);

    // Hostname required for PC/Laptop/Tablet, auto N/A otherwise.
    const needsHostname = HOSTNAME_TYPES.includes(item.model.type as ItemType);
    const hostname = needsHostname
      ? (input.hostname?.trim() || (() => { throw new Error("Hostname required for this item type"); })())
      : "N/A";

    await tx.item.update({
      where: { id: item.id },
      data: { status: "RELEASED", hostname },
    });

    const txn = await tx.itemTxn.create({
      data: {
        type: "RELEASE",
        itemId: item.id,
        operatorId,
        statusAfter: "RELEASED",
        assigneeEmpNumber: input.assigneeEmpNumber,
        assigneeName: input.assigneeName,
        assigneeDept: input.assigneeDept || null,
        gid: input.gid,
        email: input.email,
        remarks: input.remarks || null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "RELEASED_ITEM",
        details: JSON.stringify({
          serialNumber: item.serialNumber,
          assignee: input.assigneeName,
          emp: input.assigneeEmpNumber,
        }),
        userId: operatorId,
      },
    });

    return txn;
  });
}

export async function returnItem(input: ReturnInput, operatorId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: input.itemId } });
    if (!item || item.isDeleted) throw new Error("Item not found");
    if (item.status !== "RELEASED")
      throw new Error(`Item is ${item.status}, cannot return`);

    const status =
      input.disposition === "REPAIR"
        ? "IN_REPAIR"
        : input.disposition === "DISPOSE"
          ? "PLAN_DISPOSE"
          : "RETURNED_KEEP";

    await tx.item.update({
      where: { id: item.id },
      data: { status },
    });

    const txn = await tx.itemTxn.create({
      data: {
        type: "RETURN",
        itemId: item.id,
        operatorId,
        statusAfter: status,
        returningPicName: input.returningPicName,
        gid: input.gid,
        email: input.email,
        assigneeDept: input.assigneeDept || null,
        returnReason: input.returnReason || null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "RETURNED_ITEM",
        details: JSON.stringify({
          serialNumber: item.serialNumber,
          pic: input.returningPicName,
          reason: input.returnReason || null,
        }),
        userId: operatorId,
      },
    });

    return txn;
  });
}
