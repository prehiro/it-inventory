"use client";

import { useActionState, useEffect, useState } from "react";
import { returnAction, type ActionResult } from "@/app/actions/inventory";
import { Toast } from "@/components/toast";

export function ReturnForm({ items }: { items: { id: string; serialNumber: string; assignee: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => returnAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (state?.ok) setToast("Item returned"); }, [state]);

  return (
    <form action={formAction} className="max-w-lg space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Item (Deployed)</label>
        <select name="itemId" required defaultValue="" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <option value="" disabled>Select item…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.serialNumber} — {i.assignee}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Returning PIC</label>
        <input name="returningPicName" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
        <input name="returnReason" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      {state && !state.ok && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
        {pending ? "Saving…" : "Return Item"}
      </button>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </form>
  );
}
