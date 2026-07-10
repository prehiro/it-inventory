import "server-only";
import { prisma } from "@/lib/db";
import type { ReceiveInput, ReleaseInput, ReturnInput } from "@/lib/validation";

/**
 * All inventory mutations run inside a single interactive $transaction so the
 * row lock (Item read) + write + audit log either all commit or all roll back.
 * This prevents two operators from releasing the same item concurrently.
 */

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
        remarks: input.remarks || null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "RECEIVED_ITEM",
        details: JSON.stringify({
          serialNumber: item.serialNumber,
          model: model.name,
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
    const item = await tx.item.findUnique({ where: { id: input.itemId } });
    if (!item || item.isDeleted) throw new Error("Item not found");
    if (item.status !== "AVAILABLE")
      throw new Error(`Item is ${item.status}, cannot release`);

    await tx.item.update({
      where: { id: item.id },
      data: { status: "DEPLOYED" },
    });

    const txn = await tx.itemTxn.create({
      data: {
        type: "RELEASE",
        itemId: item.id,
        operatorId,
        assigneeEmpNumber: input.assigneeEmpNumber,
        assigneeName: input.assigneeName,
        assigneeDept: input.assigneeDept || null,
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
    if (item.status !== "DEPLOYED")
      throw new Error(`Item is ${item.status}, cannot return`);

    await tx.item.update({
      where: { id: item.id },
      data: { status: "RETURNED_KEEP" },
    });

    const txn = await tx.itemTxn.create({
      data: {
        type: "RETURN",
        itemId: item.id,
        operatorId,
        returningPicName: input.returningPicName,
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
