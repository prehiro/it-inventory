"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { releaseAction, releaseBatchAction, type ActionResult, type BatchActionResult } from "@/app/actions/inventory";
import { SectionCombobox } from "@/components/section-combobox";
import { HOSTNAME_TYPES } from "@/lib/types";

type Lookup = {
  id: string;
  serialNumber: string;
  type: string;
  brand: string;
  model: string;
  category: string;
  location: string;
  status: string;
  receivedAt: string;
  releasedAt?: string;
};

type BatchLookup = { serial: string; item?: Lookup; error?: string };

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
  const [serial, setSerial] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [released, setReleased] = useState(false);
  const [releasedItem, setReleasedItem] = useState<Lookup | null>(null);
  const [dept, setDept] = useState("");
  const [hostname, setHostname] = useState("BAL");

  const HOSTNAME_PREFIX = "BAL";
  function onHostnameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    setHostname(v.startsWith(HOSTNAME_PREFIX) ? v : HOSTNAME_PREFIX + v.replace(/BAL/g, ""));
  }
  const [empNumber, setEmpNumber] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const BLOCKED_STATUSES = ["RELEASED", "PLAN_DISPOSE", "IN_REPAIR"];
  const blockedStatus = lookup && BLOCKED_STATUSES.includes(lookup.status) ? lookup.status : null;

  // --- Batch mode ---
  const [batchMode, setBatchMode] = useState(false);
  const [batchSerials, setBatchSerials] = useState("");
  const [batchLookups, setBatchLookups] = useState<BatchLookup[]>([]);
  const [batchPending, setBatchPending] = useState(false);
  const [batchWarnings, setBatchWarnings] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<BatchActionResult | null>(null);
  const [batchRunId, setBatchRunId] = useState(0);
  const [toast, setToast] = useState<{ ok: number; fail: number } | null>(null);
  const [singleToast, setSingleToast] = useState(false);
  const [remarksBatch, setRemarksBatch] = useState("");
  const [batchGid, setBatchGid] = useState("");
  const [batchEmail, setBatchEmail] = useState("");
  const [batchErr, setBatchErr] = useState<string | null>(null);
  const [batchCompleted, setBatchCompleted] = useState<{
    results: BatchLookup[];
    outcomes: { serial: string; ok: boolean; error?: string }[];
    assignee: string;
    dupCount: number;
  } | null>(null);
  const batchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Batch: debounced lookup for each serial
  useEffect(() => {
    if (!batchMode) return;
    const list = batchSerials.split("\n").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) { setBatchLookups([]); setBatchWarnings([]); return; }

    if (batchDebounce.current) clearTimeout(batchDebounce.current);
    batchDebounce.current = setTimeout(async () => {
      const results: BatchLookup[] = [];
      const warns: string[] = [];
      for (const s of list) {
        try {
          const res = await fetch(`/api/item/lookup?serial=${encodeURIComponent(s)}`);
          const data = await res.json();
          if (data.found) {
            results.push({ serial: s, item: data.item });
            if (HOSTNAME_TYPES.includes(data.item.type)) {
              warns.push(`"${s}" is ${data.item.type} — single release only`);
            }
          } else {
            results.push({ serial: s, error: data.reason ?? "Not found" });
          }
        } catch {
          results.push({ serial: s, error: "Lookup failed" });
        }
      }
      setBatchLookups(results);
      setBatchWarnings(warns);
    }, 500);
  }, [batchSerials, batchMode]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSingleToast(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Auto-uppercase hostname when item category is NCA
  useEffect(() => {
    if (lookup && lookup.category === "NCA") {
      setHostname((prev) => prev.toUpperCase());
    }
  }, [lookup]);

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
    setHostname("BAL");
    setEmpNumber("");
    setAssigneeName("");
    setDept("");
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runLookup(v), 300);
  }

  async function onSubmitBatch(e: React.FormEvent) {
    e.preventDefault();
    const list = batchSerials.split("\n").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return;

    // Deduplicate
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const s of list) {
      if (!seen.has(s)) { seen.add(s); uniq.push(s); }
    }
    const dupCount = list.length - uniq.length;
    if (uniq.length === 0) return;

    setBatchPending(true);
    setBatchResults(null);
    setToast(null);
    setBatchErr(null);
    try {
      const res = await releaseBatchAction({
        serials: uniq,
        assigneeEmpNumber: empNumber,
        assigneeName,
        assigneeDept: dept,
        gid: batchGid,
        email: batchEmail,
        hostname: "N/A",
        remarks: remarksBatch,
      });
      setBatchResults(res);
      setBatchRunId((n) => n + 1);
      if (res.ok && res.results) {
        setBatchCompleted({
          results: batchLookups,
          outcomes: res.results,
          assignee: assigneeName || empNumber,
          dupCount,
        });
        setBatchSerials("");
        setBatchLookups([]);
        setBatchWarnings([]);
        setToast({ ok: res.results.filter((r) => r.ok).length, fail: res.results.filter((r) => !r.ok).length });
      } else if (!res.ok) {
        setBatchErr(res.error);
      }
    } finally {
      setBatchPending(false);
    }
  }

  const batchCount = batchSerials.split("\n").filter((s) => s.trim()).length;
  const hasWarnings = batchWarnings.length > 0;

  return (
    <>
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        {/* LEFT: inputs */}
        <div className="space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <input type="hidden" name="itemId" value={lookup?.id ?? ""} />
          {/* SERIAL NUMBER + BATCH TOGGLE */}
          <div>
            <div className="mb-1.5 flex items-center gap-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
              {batchMode ? (
                <button
                  type="button"
                  onClick={() => { setBatchMode((b) => !b); setBatchSerials(""); setBatchLookups([]); setBatchWarnings([]); }}
                  className="animate-rotate-border items-center gap-1 rounded-lg p-[1.5px]"
                >
                  <span className="flex items-center gap-1 rounded-[7px] bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Batch SN
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setBatchMode((b) => !b); setBatchSerials(""); setBatchLookups([]); setBatchWarnings([]); setBatchErr(null); setBatchCompleted(null); }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Batch SN
                </button>
              )}
            </div>

            {batchMode ? (
              <>
                <textarea
                  value={batchSerials}
                  onChange={(e) => setBatchSerials(e.target.value.toUpperCase())}
                  rows={5}
                  placeholder={"SN-001\nSN-002\nSN-003"}
                  className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-400">Total {batchCount} SN</p>
                {hasWarnings && (
                  <div className="mt-1 space-y-0.5">
                    {batchWarnings.map((w, i) => (
                      <p key={i} className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 9v4M12 17h.01" />
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                        {w}
                      </p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  name="serialNumber"
                  value={serial}
                  onChange={onSerialChange}
                  required
                  placeholder="Scan or type serial…"
                  className={`${blockedStatus ? "input-glow-error" : "input-glow"} w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-0 dark:bg-slate-800 dark:text-slate-100 ${
                    blockedStatus
                      ? "border-rose-400 focus:border-rose-500 dark:border-rose-500/60"
                      : "border-slate-300 focus:border-[#066fd1] dark:border-slate-700"
                  }`}
                />
                {checking && <p className="mt-1 text-xs text-slate-400">Checking…</p>}
                {lookupErr && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{lookupErr}</p>}
                {released ? (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item released</p>
                ) : lookup && blockedStatus ? (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">✗ {blockedStatus} — cannot be released</p>
                ) : lookup ? (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Item found — ready to release</p>
                ) : null}
              </>
            )}
          </div>

          {!batchMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Emp #</label>
                  <input name="assigneeEmpNumber" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); setEmpNumber(e.target.value.toUpperCase()); }} className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Name</label>
                  <input name="assigneeName" required onChange={(e) => { e.target.value = titleCase(e.target.value); setAssigneeName(e.target.value); }} className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GID</label>
                  <input name="gid" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input name="email" type="email" required className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
                <SectionCombobox name="assigneeDept" value={dept} onChange={setDept} />
              </div>
              {lookup && HOSTNAME_TYPES.includes(lookup.type as (typeof HOSTNAME_TYPES)[number]) && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Hostname <span className="text-rose-500">*</span></label>
                  <input name="hostname" required placeholder="BAL" value={hostname} onChange={onHostnameChange}
                    onKeyDown={(e) => {
                      const el = e.currentTarget;
                      const atPrefix = el.selectionStart !== null && el.selectionStart <= HOSTNAME_PREFIX.length && el.selectionEnd !== null && el.selectionEnd <= HOSTNAME_PREFIX.length;
                      if ((e.key === "Backspace" || e.key === "Delete") && atPrefix) e.preventDefault();
                    }}
                    onPaste={(e) => {
                      const el = e.currentTarget;
                      if (el.selectionStart !== null && el.selectionStart < HOSTNAME_PREFIX.length) e.preventDefault();
                    }}
                    className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
                <input name="remarks" className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
              </div>
              <button
                disabled={pending || !lookup || !!blockedStatus}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Release Item"}
              </button>
              {state && !state.ok && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>
              )}
            </>
          )}

          {batchMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Emp #</label>
                  <input value={empNumber} onChange={(e) => setEmpNumber(e.target.value.toUpperCase())} required className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Name</label>
                  <input value={assigneeName} onChange={(e) => setAssigneeName(titleCase(e.target.value))} required className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
                <SectionCombobox name="" value={dept} onChange={setDept} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GID</label>
                  <input value={batchGid} onChange={(e) => setBatchGid(e.target.value.toUpperCase())} required className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input value={batchEmail} onChange={(e) => setBatchEmail(e.target.value)} type="email" required className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks <span className="font-normal text-slate-400">(optional)</span></label>
                <input value={remarksBatch} onChange={(e) => setRemarksBatch(e.target.value)} className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
              </div>
              <button
                type="button"
                onClick={onSubmitBatch}
                disabled={batchPending || batchCount === 0 || hasWarnings}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {batchPending ? `Releasing ${batchCount} items…` : `Release ${batchCount} item${batchCount === 1 ? "" : "s"}`}
              </button>
              {hasWarnings && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  ⚠ PC/Laptop/Tablet items cannot be batch released. Remove them above.
                </p>
              )}
              {batchErr && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{batchErr}</p>
              )}
            </>
          )}
        </div>

        {/* RIGHT: preview / results */}
        <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {batchMode ? "ITEMS DETAILS" : "ITEM DETAILS"}
          </h3>
          <div key={batchMode ? `b-${batchRunId}` : released && releasedItem ? `r-${releasedItem.serialNumber}` : lookup ? `l-${lookup.serialNumber}` : "empty"} className="animate-panel-in">
            {batchMode && batchCompleted ? (
              <div className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {/* Timeline receipt header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
                      <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Batch Release Complete</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Assignee: {batchCompleted.assignee}</p>
                  </div>
                </div>
                {/* Timeline items */}
                {(() => {
                  const ok = batchCompleted.outcomes.filter((r) => r.ok).length;
                  const fail = batchCompleted.outcomes.filter((r) => !r.ok).length;
                  return (
                    <>
                      {batchCompleted.outcomes.map((outcome, i) => {
                        const bl = batchCompleted.results.find((r) => r.serial === outcome.serial);
                        return (
                          <div
                            key={i}
                            className={`animate-fade-in rounded-xl border-l-4 px-4 py-3 text-sm ${
                              outcome.ok
                                ? "border-l-emerald-400 bg-emerald-50/40 dark:border-l-emerald-500/60 dark:bg-emerald-500/5"
                                : "border-l-rose-400 bg-rose-50/40 dark:border-l-rose-500/60 dark:bg-rose-500/5"
                            }`}
                            style={{ animationDelay: `${Math.min(i, 15) * 45}ms`, animationFillMode: "both" }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {outcome.ok ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5 shrink-0 text-rose-500" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                                  )}
                                  <p className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{outcome.serial}</p>
                                </div>
                                {bl && bl.item ? (
                                  <p className="ml-5 truncate text-xs text-slate-500 dark:text-slate-400">
                                    {bl.item.type} · {bl.item.brand} · {bl.item.model}
                                  </p>
                                ) : null}
                                {outcome.ok ? (
                                  <p className="ml-5 text-[11px] text-emerald-600 dark:text-emerald-400">→ Released to {batchCompleted.assignee}</p>
                                ) : (
                                  <p className="ml-5 text-[11px] text-rose-500">{outcome.error || "Failed"}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                        <span className="text-slate-400 dark:text-slate-500">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">✅ {ok} released</span>
                          {fail > 0 && (
                            <span className="ml-2 font-medium text-rose-500">❌ {fail} failed</span>
                          )}
                          {batchCompleted.dupCount > 0 && (
                            <span className="ml-2 text-slate-400">({batchCompleted.dupCount} duplicate SN removed)</span>
                          )}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : batchMode && batchLookups.length > 0 ? (
              <div className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {/* Summary badge */}
                <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <span>Total {batchLookups.length}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    {batchLookups.filter(bl => bl.item && (bl.item.status === "AVAILABLE" || bl.item.status === "RETURNED_KEEP")).length} ready
                  </span>
                  {(() => {
                    const blocked = batchLookups.filter(bl => !bl.item || (bl.item.status !== "AVAILABLE" && bl.item.status !== "RETURNED_KEEP")).length;
                    return blocked > 0 ? (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                          {blocked} blocked
                        </span>
                      </>
                    ) : null;
                  })()}
                </div>
                {batchLookups.map((bl, i) => (
                  <div
                    key={i}
                    className={`animate-fade-in rounded-xl border-l-4 px-4 py-3 text-sm transition ${
                      !bl.item
                        ? "border-l-rose-400 bg-rose-50/40 dark:border-l-rose-500/60 dark:bg-rose-500/5"
                        : bl.item.status === "AVAILABLE" || bl.item.status === "RETURNED_KEEP"
                          ? "border-l-emerald-400 bg-emerald-50/40 dark:border-l-emerald-500/60 dark:bg-emerald-500/5"
                          : "border-l-rose-400 bg-rose-50/40 dark:border-l-rose-500/60 dark:bg-rose-500/5"
                    }`}
                    style={{ animationDelay: `${Math.min(i, 15) * 45}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{bl.serial}</p>
                        {bl.item ? (
                          <>
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                              {bl.item.type} · {bl.item.brand} · {bl.item.model}
                            </p>
                            {bl.item.location && (
                              <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                                📍 {bl.item.location}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="mt-0.5 text-xs text-rose-500">{bl.error}</p>
                        )}
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {bl.item ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                              bl.item.status === "AVAILABLE" || bl.item.status === "RETURNED_KEEP"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                                : "bg-rose-50 text-rose-700 ring-rose-600/30 dark:bg-rose-500/15 dark:text-rose-400"
                            }`}
                          >
                            {bl.item.status === "AVAILABLE" || bl.item.status === "RETURNED_KEEP" ? "Ready" : bl.item.status}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600 ring-1 ring-inset ring-rose-600/30 dark:bg-rose-500/15 dark:text-rose-400">
                            Not found
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : batchMode && batchCount > 0 && batchLookups.length === 0 ? (
              <p className="text-sm text-slate-400 animate-pulse">Looking up items…</p>
            ) : released && releasedItem ? (
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
        </div>
      </form>

      {/* SUCCESS MODAL (batch) */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <div key={batchRunId} className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Batch released</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {toast.ok} item{toast.ok !== 1 ? "s" : ""} released{toast.fail > 0 && ` · ${toast.fail} failed`}
              </p>
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => {
                    setToast(null);
                    setBatchSerials("");
                    setBatchLookups([]);
                    setBatchWarnings([]);
                    setBatchResults(null);
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL (single) */}
      {singleToast && (
        <div
          onClick={() => setSingleToast(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <div className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Item released</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Item has been released successfully</p>
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => setSingleToast(false)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  const isAvail = badge && value === "AVAILABLE";
  const isPlanDispose = badge && value === "PLAN_DISPOSE";
  const isInRepair = badge && value === "IN_REPAIR";
  const isReleased = badge && value === "RELEASED";
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            isAvail
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-400"
              : isPlanDispose
                ? "bg-rose-50 text-rose-700 ring-rose-600/30 dark:bg-rose-500/15 dark:text-rose-400"
                : isInRepair
                  ? "bg-amber-50 text-amber-700 ring-amber-600/30 dark:bg-amber-500/15 dark:text-amber-400"
                  : isReleased
                    ? "bg-sky-50 text-sky-700 ring-sky-600/30 dark:bg-sky-500/15 dark:text-sky-400"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400"
          }`}
          style={isAvail ? { boxShadow: "0 0 10px 1px rgba(16,185,129,0.55)" } : isPlanDispose ? { boxShadow: "0 0 10px 1px rgba(244,63,94,0.55)" } : undefined}
        >
          {value}
        </span>
      ) : (
        <dd className="font-medium text-slate-800 dark:text-slate-100">{value}</dd>
      )}
    </div>
  );
}
