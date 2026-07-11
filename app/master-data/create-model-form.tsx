"use client";

import { useActionState } from "react";
import { createModelAction, type MasterDataResult } from "@/app/actions/master-data";

export function CreateModelForm() {
  const [state, formAction, pending] = useActionState<MasterDataResult, FormData>(
    async (_prev, formData) => {
      const data = Object.fromEntries(formData.entries());
      return createModelAction(data);
    },
    { ok: true },
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
        <input name="name" required className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Brand</label>
        <input name="brand" required className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
        <select name="category" defaultValue="FA" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <option value="FA">FA</option>
          <option value="NCA">NCA</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Add Model"}
      </button>
      {!state.ok && <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>}
    </form>
  );
}
