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
      const statusChanged = status !== item.status;
      if (status !== item.status) changes.status = { old: item.status, new: status };

      const hostname = input.hostname.trim() || "N/A";
      if (hostname !== item.hostname) changes.hostname = { old: item.hostname, new: hostname };

      const remarks = input.remarks.trim() || null;
      if (remarks !== item.remarks) changes.remarks = { old: item.remarks, new: remarks };

      const emp = input.empNumber.trim() || null;
      const name = input.picName.trim() || null;
      const dept = input.section.trim() || null;
      const gid = input.gid.trim() || null;
      const email = input.email.trim() || null;

      // Assignee-field diffs vs the latest RELEASE txn (recorded in the audit log).
      const assigneeChanges: Record<string, { old: string | null; new: string | null }> = {};
      if (txn) {
        if (emp !== (txn.assigneeEmpNumber ?? null))
          assigneeChanges.empNumber = { old: txn.assigneeEmpNumber, new: emp };
        if (name !== (txn.assigneeName ?? null))
          assigneeChanges.picName = { old: txn.assigneeName, new: name };
        if (dept !== (txn.assigneeDept ?? null))
          assigneeChanges.section = { old: txn.assigneeDept, new: dept };
        if (gid !== (txn.gid ?? null)) assigneeChanges.gid = { old: txn.gid, new: gid };
        if (email !== (txn.email ?? null)) assigneeChanges.email = { old: txn.email, new: email };
        Object.assign(changes, assigneeChanges);
      }

      // Correction mode (status unchanged): patch the latest RELEASE txn so the
      // report/ledger data stays consistent. When the status CHANGED we create a
      // new lifecycle txn below instead — the old txn's history stays immutable
      // (otherwise movement history shows two records with the same statusAfter).
      if (txn && !statusChanged && Object.keys(assigneeChanges).length > 0) {
        await tx.itemTxn.update({
          where: { id: txn.id },
          data: {
            assigneeEmpNumber: emp,
            assigneeName: name,
            assigneeDept: dept,
            gid,
            email,
          },
        });
      }

      if (Object.keys(changes).length > 0 || statusChanged) {
        await tx.item.update({
          where: { id: item.id },
          data: { status, hostname, remarks },
        });

        // Keep the movement reports consistent: a status change from the edit
        // row also records the matching lifecycle transaction (same shape as
        // the dedicated Release / Return / Restore flows in lib/inventory.ts).
        if (statusChanged) {
          if (status === "RELEASED") {
            await tx.itemTxn.create({
              data: {
                type: "RELEASE",
                itemId: item.id,
                operatorId: session.user.id,
                statusAfter: "RELEASED",
                assigneeEmpNumber: emp,
                assigneeName: name,
                assigneeDept: dept,
                gid,
                email,
              },
            });
          } else if (status === "RETURNED_KEEP" || status === "IN_REPAIR" || status === "PLAN_DISPOSE") {
            await tx.itemTxn.create({
              data: {
                type: "RETURN",
                itemId: item.id,
                operatorId: session.user.id,
                statusAfter: status,
                returningPicName: [emp, name].filter(Boolean).join(" — "),
                gid,
                email,
                assigneeDept: dept,
              },
            });
          } else if (status === "AVAILABLE") {
            await tx.itemTxn.create({
              data: {
                type: "RECEIVE",
                itemId: item.id,
                operatorId: session.user.id,
                statusAfter: "AVAILABLE",
                remarks: "Status changed via PC Ledger edit",
              },
            });
            // Back to stock → the assignment is void: clear the assignee data on
            // the latest RELEASE txn so the old GID / PIC don't linger in the
            // ledger (movement history never displays these fields).
            if (txn) {
              await tx.itemTxn.update({
                where: { id: txn.id },
                data: {
                  assigneeEmpNumber: null,
                  assigneeName: null,
                  assigneeDept: null,
                  gid: null,
                  email: null,
                },
              });
            }
          }
        }

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

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/pc-ledger");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update PC Ledger row",
    };
  }
}
