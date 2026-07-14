"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { releaseAction, type ActionResult } from "@/app/actions/inventory";
import { Toast } from "@/components/toast";
import { SectionCombobox } from "@/components/section-combobox";
import { HOSTNAME_TYPES } from "@/lib/types";

type Lookup = {
  id: string;
  serialNumber: string;
  type: string;
  brand: string;
  model: string;
  location: string;
  status: string;
  receivedAt: string;
  releasedAt?: string;
};

function titleCase(v: string): string {
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${days[dt.getDay()]}, ${dd}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
}

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
  const [released, setReleased] = useState(false);
  const [releasedItem, setReleasedItem] = useState<Lookup | null>(null);
  const [dept, setDept] = useState("");
  const [hostname, setHostname] = useState("");
  const [empNumber, setEmpNumber] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && lookup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReleasedItem({ ...lookup, releasedAt: state.releasedAt ?? new Date().toISOString() });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReleased(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSerial("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLookup(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLookupErr(null);
      formRef.current?.reset();
      setToast("Item released");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setReleased(false);
    setReleasedItem(null);
    setHostname("");
    setEmpNumber("");
    setAssigneeName("");
    setDept("");
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
          {released ? (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item released</p>
          ) : lookup ? (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item found — ready to release</p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Emp #</label>
            <input name="assigneeEmpNumber" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); setEmpNumber(e.target.value.toUpperCase()); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Name</label>
            <input name="assigneeName" required onChange={(e) => { e.target.value = titleCase(e.target.value); setAssigneeName(e.target.value); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GID</label>
            <input name="gid" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input name="email" type="email" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
          <SectionCombobox name="assigneeDept" value={dept} onChange={setDept} />
        </div>
        {lookup && HOSTNAME_TYPES.includes(lookup.type as (typeof HOSTNAME_TYPES)[number]) && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Hostname <span className="text-rose-500">*</span></label>
            <input name="hostname" required placeholder="e.g. PC-DIRE-001" value={hostname} onChange={(e) => setHostname(e.target.value.toUpperCase())} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          </div>
        )}
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
        {released && releasedItem ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8" strokeLinecap="round" strokeLinejoin="round">
                <path className="animate-check-draw" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">Item released</p>
            <dl className="w-full space-y-3 text-left text-sm">
              <Row label="Item" value={`${releasedItem.type} ${releasedItem.brand} ${releasedItem.model}`.toUpperCase()} />
              {releasedItem.type && HOSTNAME_TYPES.includes(releasedItem.type as (typeof HOSTNAME_TYPES)[number]) && (
                <Row label="Hostname" value={hostname || "—"} />
              )}
              <Row label="Serial" value={releasedItem.serialNumber} />
              <Row label="Assignee Emp #" value={empNumber || "—"} />
              <Row label="Assignee Name" value={assigneeName || "—"} />
              <Row label="Section" value={dept || "—"} />
              <Row label="Received" value={formatDate(releasedItem.receivedAt)} />
              <Row label="Released" value={formatDate(releasedItem.releasedAt ?? null)} />
              <Row label="Status" value="RELEASED" badge />
            </dl>
          </div>
        ) : lookup ? (
          <dl className="space-y-3 text-sm">
            <Row label="Serial" value={lookup.serialNumber} />
            <Row label="Type" value={lookup.type} />
            <Row label="Brand" value={lookup.brand} />
            <Row label="Model" value={lookup.model} />
            <Row label="Location" value={lookup.location} />
            <Row label="Received" value={formatDate(lookup.receivedAt)} />
            <Row label="Status" value={lookup.status} badge />
          </dl>
        ) : (
          <div className="flex min-h-[18rem] flex-col items-center justify-center py-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/list-items.png"
              alt="Enter a serial number"
              className="mb-4 h-28 w-auto opacity-80"
            />
            <p className="text-sm text-slate-400">
              {lookupErr ? "Item not available for release." : "Enter a serial number to preview item details."}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  const isAvail = badge && value === "AVAILABLE";
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            isAvail
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400"
          }`}
          style={isAvail ? { boxShadow: "0 0 10px 1px rgba(16,185,129,0.55)" } : undefined}
        >
          {value}
        </span>
      ) : (
        <dd className="font-medium text-slate-800 dark:text-slate-100">{value}</dd>
      )}
    </div>
  );
}
