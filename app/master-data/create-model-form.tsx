"use client";

import { useActionState } from "react";
import { createModelAction, type MasterDataResult } from "@/app/actions/master-data";
import { ITEM_TYPES } from "@/lib/types";

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
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Type</label>
        <select name="type" required defaultValue="" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <option value="" disabled>Select type…</option>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Brand</label>
        <input name="brand" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Model</label>
        <input name="model" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
        <select name="category" defaultValue="FA" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <option value="FA">FA</option>
          <option value="NCA">NCA</option>
          <option value="GENERAL">GENERAL</option>
        </select>
      </div>
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Add Model"}
      </button>
      {!state.ok && <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>}
    </form>
  );
}
