"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { itemModelSchema } from "@/lib/validation";

export type MasterDataResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session.user.id;
}

export async function createModelAction(
  data: Record<string, unknown>,
): Promise<MasterDataResult> {
  try {
    const userId = await requireAdmin();
    const parsed = itemModelSchema.safeParse(data);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };

    await prisma.itemModel.create({
      data: { ...parsed.data, isDeleted: false },
    });
    await prisma.auditLog.create({
      data: {
        action: "CREATED_MODEL",
        details: JSON.stringify(parsed.data),
        userId,
      },
    });
    revalidatePath("/master-data");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateModelAction(
  id: string,
  data: Record<string, unknown>,
): Promise<MasterDataResult> {
  try {
    const userId = await requireAdmin();
    const parsed = itemModelSchema.safeParse(data);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };

    await prisma.itemModel.update({
      where: { id },
      data: parsed.data,
    });
    await prisma.auditLog.create({
      data: {
        action: "UPDATED_MODEL",
        details: JSON.stringify({ id, ...parsed.data }),
        userId,
      },
    });
    revalidatePath("/master-data");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteModelAction(
  id: string,
): Promise<MasterDataResult> {
  try {
    const userId = await requireAdmin();
    const activeItems = await prisma.item.count({
      where: { modelId: id, isDeleted: false },
    });
    if (activeItems > 0) {
      return {
        ok: false,
        error: `Model masih dipakai ${activeItems} item aktif. Hapus/dispose item tersebut dulu.`,
      };
    }
    await prisma.itemModel.update({
      where: { id },
      data: { isDeleted: true },
    });
    await prisma.auditLog.create({
      data: {
        action: "DELETED_MODEL",
        details: JSON.stringify({ id }),
        userId,
      },
    });
    revalidatePath("/master-data");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
