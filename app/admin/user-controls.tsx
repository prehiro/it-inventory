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
      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 outline-none disabled:opacity-60 dark:bg-indigo-500/15 dark:text-indigo-300"
      >
        <option value="OPERATOR" className="text-slate-900">Operator</option>
        <option value="MANAGER" className="text-slate-900">Manager</option>
        <option value="ADMIN" className="text-slate-900">Admin</option>
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
      className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-500/10"
    >
      Delete
    </button>
  );
}
