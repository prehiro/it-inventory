"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { returnAction, type ActionResult } from "@/app/actions/inventory";
import { statusLabel } from "@/lib/types";
import { Toast } from "@/components/toast";
import { SectionCombobox } from "@/components/section-combobox";

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
  releasedAt: string | null;
  returnedAt?: string;
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
  const [picEmp, setPicEmp] = useState("");
  const [picName, setPicName] = useState("");
  const [picGid, setPicGid] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picDept, setPicDept] = useState("");
  const [disposition, setDisposition] = useState<"KEEP" | "REPAIR" | "DISPOSE" | "">("");
  const [returnedDisposition, setReturnedDisposition] = useState<"KEEP" | "REPAIR" | "DISPOSE" | "">("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && lookup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturnedItem({ ...lookup, returnedAt: state.txnAt ?? new Date().toISOString() });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturnedDisposition(disposition);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturned(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSerial("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisposition("");
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
        if (data.found) {
          setLookup(data.item);
          setPicDept(data.item.assigneeDept ?? "");
        } else setLookupErr(data.reason ?? "Not found");
      })
      .catch(() => setLookupErr("Lookup failed"))
      .finally(() => setChecking(false));
  }

  function onSerialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSerial(v);
    setReturned(false);
    setReturnedItem(null);
    setReturnedDisposition("");
    setPicEmp("");
    setPicName("");
    setPicGid("");
    setPicEmail("");
    setPicDept("");
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
          <div className="grid grid-cols-2 gap-4">
            <input
              name="assigneeEmpNumber"
              value={picEmp}
              onChange={(e) => setPicEmp(e.target.value.toUpperCase())}
              placeholder="Emp #"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              name="assigneeName"
              value={picName}
              onChange={(e) => setPicName(titleCase(e.target.value))}
              placeholder="Name"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <input
              name="gid"
              value={picGid}
              onChange={(e) => setPicGid(e.target.value.toUpperCase())}
              placeholder="GID"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              name="email"
              type="email"
              value={picEmail}
              onChange={(e) => setPicEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
            <SectionCombobox name="assigneeDept" value={picDept} onChange={setPicDept} />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Disposition</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "KEEP", label: "Returned Keep", sub: "Available to release again", color: "blue", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
              { key: "REPAIR", label: "Repair", sub: "Sent for repair", color: "amber", icon: "M14.7 6.3a4 4 0 00-5.6 5.6L3 18v3h3l6.1-6.1a4 4 0 005.6-5.6l-2.5 2.5-2.1-2.1 2.5-2.5z" },
              { key: "DISPOSE", label: "Dispose", sub: "Scrapped / discarded", icon: "M19 7l-.9 12.1a2 2 0 01-2 1.9H7.9a2 2 0 01-2-1.9L5 7m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2m-6 0h4" },
            ] as const).map((opt) => {
              const active = disposition === opt.key;
              const ring =
                opt.key === "KEEP"
                  ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                  : opt.key === "REPAIR"
                    ? "border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                    : "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300";
              const cardRing =
                opt.key === "KEEP"
                  ? "border-blue-300 dark:border-blue-700"
                  : opt.key === "REPAIR"
                    ? "border-amber-300 dark:border-amber-700"
                    : "border-rose-300 dark:border-rose-700";
              const cardText =
                opt.key === "KEEP"
                  ? "text-blue-600 dark:text-blue-300"
                  : opt.key === "REPAIR"
                    ? "text-amber-600 dark:text-amber-300"
                    : "text-rose-600 dark:text-rose-300";
              const neon =
                opt.key === "KEEP"
                  ? "rgba(59,130,246,0.65)"
                  : opt.key === "REPAIR"
                    ? "rgba(245,158,11,0.65)"
                    : "rgba(244,63,94,0.65)";
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setDisposition(opt.key)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                    active ? `${cardRing} ${cardText}` : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  }`}
                  style={active ? { boxShadow: `0 0 12px 1px ${neon}` } : undefined}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${
                      active ? `${ring} animate-neon-breath` : "border-slate-200 text-slate-400 dark:border-slate-700"
                    }`}
                    style={active ? { ["--neon" as string]: neon } : undefined}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={opt.icon} />
                    </svg>
                  </span>
                  <span className={`text-xs font-medium ${active ? cardText : "text-slate-600 dark:text-slate-300"}`}>{opt.label}</span>
                  <span className="text-[10px] leading-tight text-slate-400">{opt.sub}</span>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="disposition" value={disposition} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
          <input name="returnReason" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <button
          disabled={pending || !lookup || !disposition}
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
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Returned Item Details</h3>
        {returned && returnedItem ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8" strokeLinecap="round" strokeLinejoin="round">
                <path className="animate-check-draw" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">Item returned</p>
            <dl className="w-full space-y-3 text-left text-sm">
              <Row label="Item" value={`${returnedItem.type} ${returnedItem.brand} ${returnedItem.model}`.toUpperCase()} />
              <Row label="Serial" value={returnedItem.serialNumber} />
              <Row label="Location" value={returnedItem.location} />
              <Row label="Assignee" value={assigneeLabel(returnedItem)} />
              <Row label="Returned by" value={[picEmp, picName].filter(Boolean).join(" — ") || "—"} />
              <Row label="Section" value={picDept || "—"} />
              <Row label="Deployed" value={formatDate(returnedItem.releasedAt)} />
              <Row label="Returned" value={formatDate(returnedItem.returnedAt ?? null)} />
              <Row
                label="Status"
                value={
                  returnedDisposition === "REPAIR"
                    ? statusLabel("IN_REPAIR")
                    : returnedDisposition === "DISPOSE"
                      ? statusLabel("PLAN_DISPOSE")
                      : statusLabel("RETURNED_KEEP")
                }
                badge
                badgeTone={returnedDisposition === "DISPOSE" ? "rose" : returnedDisposition === "REPAIR" ? "amber" : "blue"}
              />
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
            <Row label="Deployed" value={formatDate(lookup.releasedAt)} />
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
              {lookupErr ? "Item not available to return." : "Enter a serial number to preview item details."}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

function assigneeLabel(l: Lookup): string {
  const parts = [l.assigneeEmpNumber, l.assigneeName, l.assigneeDept].filter(Boolean);
  return parts.length ? parts.join(" — ") : "—";
}

function Row({
  label,
  value,
  badge,
  badgeTone = "emerald",
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeTone?: "emerald" | "blue" | "amber" | "rose";
}) {
  const TONES: Record<string, { cls: string; glow: string }> = {
    emerald: {
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400",
      glow: "rgba(16,185,129,0.55)",
    },
    blue: {
      cls: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300",
      glow: "rgba(59,130,246,0.55)",
    },
    amber: {
      cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300",
      glow: "rgba(245,158,11,0.55)",
    },
    rose: {
      cls: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300",
      glow: "rgba(244,63,94,0.55)",
    },
  };
  const t = TONES[badgeTone] ?? TONES.emerald;
  const glow = badge && (badgeTone !== "emerald" || value === "AVAILABLE");
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${t.cls}`}
          style={glow ? { boxShadow: `0 0 10px 1px ${t.glow}` } : undefined}
        >
          {value}
        </span>
      ) : (
        <dd className="font-medium text-slate-800 dark:text-slate-100">{value}</dd>
      )}
    </div>
  );
}
