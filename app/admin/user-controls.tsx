"use client";

import { useTransition } from "react";
import { updateUserRoleAction, deleteUserAction } from "@/app/actions/users";

export function RoleSelect({ employeeNumber, role }: { employeeNumber: string; role: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => start(async () => { await updateUserRoleAction(employeeNumber, e.target.value); })}
      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 outline-none disabled:opacity-60"
    >
      <option value="OPERATOR">Operator</option>
      <option value="MANAGER">Manager</option>
      <option value="ADMIN">Admin</option>
    </select>
  );
}

export function DeleteUserButton({ employeeNumber }: { employeeNumber: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete user ${employeeNumber}?`)) start(async () => { await deleteUserAction(employeeNumber); });
      }}
      className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
    >
      Delete
    </button>
  );
}
