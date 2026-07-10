"use client";

import { useActionState } from "react";
import { releaseAction, type ActionResult } from "@/app/actions/inventory";

export function ReleaseForm({ items }: { items: { id: string; serialNumber: string; model: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => releaseAction(Object.fromEntries(formData.entries())),
    { ok: true },
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 ring-1 ring-slate-200">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Item (Available)</label>
        <select name="itemId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Select item…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.serialNumber} — {i.model}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assignee Emp #</label>
          <input name="assigneeEmpNumber" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assignee Name</label>
          <input name="assigneeName" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
        <input name="assigneeDept" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
        <input name="remarks" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {!state.ok && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.ok === true && <p className="text-sm text-emerald-600">Released.</p>}
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Release Item"}
      </button>
    </form>
  );
}
