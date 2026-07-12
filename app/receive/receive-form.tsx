"use client";

import { useActionState, useEffect, useState } from "react";
import { receiveAction, type ActionResult } from "@/app/actions/inventory";
import { Toast } from "@/components/toast";
import { ModelCombobox } from "@/components/model-combobox";

export function ReceiveForm({ models }: { models: { id: string; type: string; name: string; brand: string; category: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => receiveAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state?.ok) setToast("Item received");
  }, [state]);

  return (
    <form
      action={formAction}
      className="max-w-lg space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <input type="hidden" name="modelId" value={modelId} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Item Type / Model</label>
        <ModelCombobox
          models={models}
          value={modelId}
          onChange={setModelId}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
        <input name="serialNumber" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" placeholder="SN-..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">PO Number</label>
          <input name="poNumber" defaultValue="PTCAP__" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
          <input
            value="IT Store"
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500"
          />
          <input type="hidden" name="location" value="IT Store" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
        <input name="remarks" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      {state && !state.ok && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Receive Item"}
      </button>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </form>
  );
}
