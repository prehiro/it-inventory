"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { releaseAction, type ActionResult } from "@/app/actions/inventory";
import { Toast } from "@/components/toast";

type Lookup = {
  id: string;
  serialNumber: string;
  type: string;
  brand: string;
  model: string;
  location: string;
  status: string;
};

export function ReleaseForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => releaseAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [serial, setSerial] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state?.ok) setToast("Item released");
  }, [state]);

  function runLookup(s: string) {
    const q = s.trim();
    setLookup(null);
    setLookupErr(null);
    if (!q) return;
    setChecking(true);
    fetch(`/api/item/lookup?serial=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.found) setLookup(data.item);
        else setLookupErr(data.reason ?? "Not found");
      })
      .catch(() => setLookupErr("Lookup failed"))
      .finally(() => setChecking(false));
  }

  function onSerialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSerial(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runLookup(v), 300);
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* LEFT: inputs */}
      <div className="space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <input type="hidden" name="itemId" value={lookup?.id ?? ""} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
          <input
            name="serialNumber"
            value={serial}
            onChange={onSerialChange}
            required
            placeholder="Scan or type serial…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {checking && <p className="mt-1 text-xs text-slate-400">Checking…</p>}
          {lookupErr && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{lookupErr}</p>}
          {lookup && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item found — ready to release</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Emp #</label>
            <input name="assigneeEmpNumber" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Name</label>
            <input name="assigneeName" required onChange={(e) => { e.target.value = titleCase(e.target.value); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
          <input name="assigneeDept" onChange={(e) => { e.target.value = titleCase(e.target.value); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
          <input name="remarks" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <button
          disabled={pending || !lookup}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Release Item"}
        </button>
        {state && !state.ok && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>
        )}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>

      {/* RIGHT: preview */}
      <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">ITEM DETAILS</h3>
        {lookup ? (
          <dl className="space-y-3 text-sm">
            <Row label="Serial" value={lookup.serialNumber} />
            <Row label="Type" value={lookup.type} />
            <Row label="Brand" value={lookup.brand} />
            <Row label="Model" value={lookup.model} />
            <Row label="Location" value={lookup.location} />
            <Row label="Status" value={lookup.status} />
          </dl>
        ) : (
          <p className="text-sm text-slate-400">
            {lookupErr ? "Item not available for release." : "Enter a serial number to preview item details."}
          </p>
        )}
      </div>
    </form>
  );
}

function titleCase(v: string): string {
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}
