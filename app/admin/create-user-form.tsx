"use client";

import { useActionState } from "react";
import { createUserAction, type UserActionResult } from "@/app/actions/users";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<UserActionResult | null, FormData>(
    async (_prev, formData) => createUserAction(Object.fromEntries(formData.entries())),
    null,
  );

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-6 dark:bg-slate-900 dark:ring-slate-800">
      <input name="employeeNumber" required placeholder="Emp # (e.g. EMP010)" className="col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      <input name="name" required placeholder="Full name" className="col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      <input name="department" placeholder="Department" className="col-span-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      <select name="role" defaultValue="OPERATOR" className="col-span-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        <option value="OPERATOR">Operator</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Admin</option>
      </select>
      <input name="password" type="password" required placeholder="Temp password (min 6)" className="col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      <button disabled={pending} className="col-span-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60 md:col-span-6 md:justify-self-start">
        {pending ? "Creating…" : "Create User"}
      </button>
      {state && !state.ok && <p className="col-span-6 text-sm text-rose-600 dark:text-rose-400">{state.error}</p>}
      {state?.ok && <p className="col-span-6 text-sm text-emerald-600 dark:text-emerald-400">User created.</p>}
    </form>
  );
}
