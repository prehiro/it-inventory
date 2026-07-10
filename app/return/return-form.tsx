"use client";

import { useActionState } from "react";
import { returnAction, type ActionResult } from "@/app/actions/inventory";

export function ReturnForm({ items }: { items: { id: string; serialNumber: string; assignee: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => returnAction(Object.fromEntries(formData.entries())),
    { ok: true },
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 ring-1 ring-slate-200">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Item (Deployed)</label>
        <select name="itemId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Select item…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.serialNumber} — {i.assignee}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Returning PIC</label>
        <input name="returningPicName" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
        <input name="returnReason" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {!state.ok && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.ok === true && <p className="text-sm text-emerald-600">Returned.</p>}
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Return Item"}
      </button>
    </form>
  );
}
