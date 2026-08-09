"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/types";

export type LedgerEditResult = { ok: true } | { ok: false; error: string };

/** Admin-only edit of a PC Ledger row (8 editable columns + status). */
export async function updateLedgerRow(
  itemId: string,
  input: {
    empNumber: string;
    picName: string;
    gid: string;
    email: string;
    hostname: string;
    section: string;
    remarks: string;
    status: string;
  },
): Promise<LedgerEditResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  if (session.user.role !== "ADMIN")
    return { ok: false, error: "Only administrators can edit PC Ledger rows" };

  if (!ITEM_STATUSES.includes(input.status as ItemStatus))
    return { ok: false, error: "Invalid status" };

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { model: true },
      });
      if (!item || item.isDeleted) throw new Error("Item not found");

      const txn = await tx.itemTxn.findFirst({
        where: { itemId: item.id, type: "RELEASE" },
        orderBy: { date: "desc" },
      });

      const changes: Record<string, { old: string | null; new: string | null }> = {};

      const status = input.status;
      if (status !== item.status) changes.status = { old: item.status, new: status };

      const hostname = input.hostname.trim() || "N/A";
      if (hostname !== item.hostname) changes.hostname = { old: item.hostname, new: hostname };

      const remarks = input.remarks.trim() || null;
      if (remarks !== item.remarks) changes.remarks = { old: item.remarks, new: remarks };

      if (txn) {
        const emp = input.empNumber.trim() || null;
        const name = input.picName.trim() || null;
        const dept = input.section.trim() || null;
        const gid = input.gid.trim() || null;
        const email = input.email.trim() || null;

        if (emp !== (txn.assigneeEmpNumber ?? null))
          changes.empNumber = { old: txn.assigneeEmpNumber, new: emp };
        if (name !== (txn.assigneeName ?? null))
          changes.picName = { old: txn.assigneeName, new: name };
        if (dept !== (txn.assigneeDept ?? null))
          changes.section = { old: txn.assigneeDept, new: dept };
        if (gid !== (txn.gid ?? null)) changes.gid = { old: txn.gid, new: gid };
        if (email !== (txn.email ?? null)) changes.email = { old: txn.email, new: email };

        if (Object.keys(changes).length > 0) {
          await tx.itemTxn.update({
            where: { id: txn.id },
            data: {
              statusAfter: status,
              assigneeEmpNumber: emp,
              assigneeName: name,
              assigneeDept: dept,
              gid,
              email,
            },
          });
        }
      }

      if (Object.keys(changes).length > 0 || status !== item.status) {
        await tx.item.update({
          where: { id: item.id },
          data: { status, hostname, remarks },
        });

        await tx.auditLog.create({
          data: {
            action: "EDIT_PC_LEDGER",
            details: JSON.stringify({
              serialNumber: item.serialNumber,
              changes,
            }),
            userId: session.user.id,
          },
        });
      }
    });

    revalidatePath("/pc-ledger");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update PC Ledger row",
    };
  }
}
