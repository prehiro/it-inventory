"use client";

import { useActionState, useEffect, useState } from "react";
import { releaseAction, type ActionResult } from "@/app/actions/inventory";
import { Toast } from "@/components/toast";

export function ReleaseForm({ items }: { items: { id: string; serialNumber: string; model: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => releaseAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (state?.ok) setToast("Item released"); }, [state]);

  return (
    <form action={formAction} className="max-w-lg space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Item (Available)</label>
        <select name="itemId" required defaultValue="" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="" disabled>Select item…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.serialNumber} — {i.model}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Assignee Emp #</label>
          <input name="assigneeEmpNumber" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Assignee Name</label>
          <input name="assigneeName" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
        <input name="assigneeDept" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Remarks</label>
        <input name="remarks" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      {state && !state.ok && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Release Item"}
      </button>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </form>
  );
}
