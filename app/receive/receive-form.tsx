"use client";

import { useActionState } from "react";
import { receiveAction, type ActionResult } from "@/app/actions/inventory";

export function ReceiveForm({ models }: { models: { id: string; name: string; brand: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => receiveAction(Object.fromEntries(formData.entries())),
    { ok: true },
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 ring-1 ring-slate-200">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Model</label>
        <select name="modelId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Select model…</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.brand} {m.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Serial Number</label>
        <input name="serialNumber" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="SN-..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">PO Number</label>
          <input name="poNumber" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
          <input name="location" defaultValue="IT Store" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
        <input name="remarks" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {!state.ok && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.ok && state.ok === true && <p className="text-sm text-emerald-600">Received.</p>}
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Receive Item"}
      </button>
    </form>
  );
}
