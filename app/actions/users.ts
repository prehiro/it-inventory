"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { userSchema } from "@/lib/validation";

export type UserActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session.user.id;
}

export async function createUserAction(
  data: Record<string, unknown>,
): Promise<UserActionResult> {
  try {
    const userId = await requireAdmin();
    const parsed = userSchema.safeParse(data);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const existing = await prisma.systemUser.findUnique({
      where: { employeeNumber: parsed.data.employeeNumber },
    });
    if (existing && !existing.isDeleted)
      return { ok: false, error: "Employee number already exists" };

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.systemUser.create({
      data: {
        employeeNumber: parsed.data.employeeNumber,
        name: parsed.data.name,
        department: parsed.data.department || null,
        role: parsed.data.role,
        passwordHash,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "CREATED_USER",
        details: JSON.stringify({ employeeNumber: parsed.data.employeeNumber, role: parsed.data.role }),
        userId,
      },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateUserRoleAction(
  employeeNumber: string,
  role: string,
): Promise<UserActionResult> {
  try {
    const userId = await requireAdmin();
    if (!["ADMIN", "MANAGER", "OPERATOR"].includes(role))
      return { ok: false, error: "Invalid role" };
    await prisma.systemUser.update({
      where: { employeeNumber },
      data: { role },
    });
    await prisma.auditLog.create({
      data: {
        action: "UPDATED_USER_ROLE",
        details: JSON.stringify({ employeeNumber, role }),
        userId,
      },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteUserAction(
  employeeNumber: string,
): Promise<UserActionResult> {
  try {
    const userId = await requireAdmin();
    await prisma.systemUser.update({
      where: { employeeNumber },
      data: { isDeleted: true },
    });
    await prisma.auditLog.create({
      data: {
        action: "DELETED_USER",
        details: JSON.stringify({ employeeNumber }),
        userId,
      },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
