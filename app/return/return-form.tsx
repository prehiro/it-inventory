"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { returnAction, type ActionResult } from "@/app/actions/inventory";
import { Toast } from "@/components/toast";

type Lookup = {
  id: string;
  serialNumber: string;
  type: string;
  brand: string;
  model: string;
  location: string;
  status: string;
  assigneeEmpNumber: string | null;
  assigneeName: string | null;
  assigneeDept: string | null;
};

function titleCase(v: string): string {
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ReturnForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => returnAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [serial, setSerial] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [returned, setReturned] = useState(false);
  const [returnedItem, setReturnedItem] = useState<Lookup | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturnedItem(lookup);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturned(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSerial("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLookup(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLookupErr(null);
      formRef.current?.reset();
      setToast("Item returned");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function runLookup(s: string) {
    const q = s.trim();
    setLookup(null);
    setLookupErr(null);
    if (!q) return;
    setChecking(true);
    fetch(`/api/item/lookup-deployed?serial=${encodeURIComponent(q)}`)
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
    setReturned(false);
    setReturnedItem(null);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runLookup(v), 300);
  }

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          {returned ? (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item returned</p>
          ) : lookup ? (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item found — ready to return</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Returning PIC</label>
          <input name="returningPicName" required onChange={(e) => { e.target.value = titleCase(e.target.value); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
          <input name="returnReason" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <button
          disabled={pending || !lookup}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Return Item"}
        </button>
        {state && !state.ok && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>
        )}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>

      {/* RIGHT: preview */}
      <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">ITEM DETAILS</h3>
        {returned && returnedItem ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8" strokeLinecap="round" strokeLinejoin="round">
                <path className="animate-check-draw" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">Item returned</p>
            <dl className="w-full space-y-3 text-left text-sm">
              <Row label="Serial" value={returnedItem.serialNumber} />
              <Row label="Type" value={returnedItem.type} />
              <Row label="Brand" value={returnedItem.brand} />
              <Row label="Model" value={returnedItem.model} />
              <Row label="Location" value={returnedItem.location} />
              <Row label="Assignee" value={assigneeLabel(returnedItem)} />
              <Row label="Status" value="RETURNED" badge />
            </dl>
          </div>
        ) : lookup ? (
          <dl className="space-y-3 text-sm">
            <Row label="Serial" value={lookup.serialNumber} />
            <Row label="Type" value={lookup.type} />
            <Row label="Brand" value={lookup.brand} />
            <Row label="Model" value={lookup.model} />
            <Row label="Location" value={lookup.location} />
            <Row label="Assignee" value={assigneeLabel(lookup)} />
            <Row label="Status" value={lookup.status} badge />
          </dl>
        ) : (
          <p className="text-sm text-slate-400">
            {lookupErr ? "Item not available to return." : "Enter a serial number to preview item details."}
          </p>
        )}
      </div>
    </form>
  );
}

function assigneeLabel(l: Lookup): string {
  const parts = [l.assigneeEmpNumber, l.assigneeName, l.assigneeDept].filter(Boolean);
  return parts.length ? parts.join(" — ") : "—";
}

function Row({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      {badge ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400">
          {value}
        </span>
      ) : (
        <dd className="font-medium text-slate-800 dark:text-slate-100">{value}</dd>
      )}
    </div>
  );
}
