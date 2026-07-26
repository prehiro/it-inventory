"use client";

import { useState, useRef } from "react";
import { releaseBatchAction, type BatchActionResult } from "@/app/actions/inventory";
import { SectionCombobox } from "@/components/section-combobox";
import { HOSTNAME_TYPES } from "@/lib/types";

type RowResult = { serial: string; ok: boolean; error?: string };

function titleCase(v: string): string {
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BatchReleaseForm() {
  const [pending, setPending] = useState(false);
  const [serials, setSerials] = useState("");
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [runId, setRunId] = useState(0);
  const [dept, setDept] = useState("");
  const [hostname, setHostname] = useState("BAL");
  const [empNumber, setEmpNumber] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [gid, setGid] = useState("");
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<{ ok: number; fail: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const HOSTNAME_PREFIX = "BAL";
  function onHostnameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    setHostname(v.startsWith(HOSTNAME_PREFIX) ? v : HOSTNAME_PREFIX + v.replace(/BAL/g, ""));
  }

  // Determine if any of the serials belong to a hostname-requiring type
  // We do a lookup against the API for each serial to detect the type
  const [needsHostname, setNeedsHostname] = useState(false);

  function onSerialsChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setSerials(v);

    // Debounced type check on the first serial
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const list = v.split("\n").map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) {
        // Check if any serial matches known PC/Laptop/Tablet
        // We'll check the first serial to determine hostname visibility
        const q = list[0];
        fetch(`/api/item/lookup?serial=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.found) {
              setNeedsHostname(HOSTNAME_TYPES.includes(data.item.type));
              if (data.item.category === "NCA") {
                setHostname((prev) => prev.toUpperCase());
              }
            }
          })
          .catch(() => {});
      }
    }, 500);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const list = serials
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return;

    setPending(true);
    setResults(null);
    setToast(null);
    try {
      const res = await releaseBatchAction({
        serials: list,
        assigneeEmpNumber: empNumber,
        assigneeName,
        assigneeDept: dept,
        gid,
        email,
        hostname: needsHostname ? hostname : "N/A",
      });
      if (res.ok && res.results) {
        setResults(res.results);
        setRunId((n) => n + 1);
        setToast({ ok: res.results.filter((r) => r.ok).length, fail: res.results.filter((r) => !r.ok).length });
      } else if (!res.ok) {
        setResults([]);
        setRunId((n) => n + 1);
      }
    } finally {
      setPending(false);
    }
  }

  const count = serials.split("\n").filter((s) => s.trim()).length;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* LEFT: input form */}
      <form onSubmit={onSubmit} className="w-full max-w-lg shrink-0 space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Serial Numbers <span className="text-rose-500">*</span>
            <span className="font-normal text-slate-400">
              {" "}(Insert 1 serial number per line)
            </span>
          </label>
          <textarea
            value={serials}
            onChange={onSerialsChange}
            required
            rows={6}
            placeholder={"SN-LAP-001\nSN-LAP-002\nSN-LAP-003\netc.."}
            className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-400">Total {count} SN</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Emp #</label>
            <input
              value={empNumber}
              onChange={(e) => setEmpNumber(e.target.value.toUpperCase())}
              required
              className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee Name</label>
            <input
              value={assigneeName}
              onChange={(e) => setAssigneeName(titleCase(e.target.value))}
              required
              className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GID</label>
            <input
              value={gid}
              onChange={(e) => setGid(e.target.value.toUpperCase())}
              required
              className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
          <SectionCombobox name="assigneeDept" value={dept} onChange={setDept} />
        </div>
        {needsHostname && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Hostname <span className="text-rose-500">*</span></label>
            <input
              value={hostname}
              onChange={onHostnameChange}
              placeholder="BAL"
              className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        )}
        <button
          disabled={pending || count === 0}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? `Releasing ${count} items…` : `Release ${count} item${count === 1 ? "" : "s"}`}
        </button>
      </form>

      {/* RIGHT: results panel */}
      <div className="hidden flex-1 min-w-0 lg:block lg:sticky lg:top-6">
        {results && (
          <div
            key={runId}
            className="animate-panel-in overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <span>Results</span>
              <span>
                {results.filter((r) => r.ok).length} ok · {results.filter((r) => !r.ok).length} failed
              </span>
            </div>
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto text-sm dark:divide-slate-800">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="flex animate-fade-in items-center gap-3 px-4 py-2.5"
                  style={{ animationDelay: `${Math.min(i, 20) * 35}ms`, animationFillMode: "both" }}
                >
                  <span
                    className={
                      r.ok
                        ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 animate-status-breath dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 animate-status-breath dark:bg-rose-500/15 dark:text-rose-400"
                    }
                    style={r.ok ? { ["--neon" as string]: "rgba(16,185,129,0.55)" } : { ["--neon" as string]: "rgba(244,63,94,0.55)" }}
                  >
                    {r.ok ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    )}
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{r.serial}</span>
                  {!r.ok && (
                    <span
                      title={r.error}
                      style={{ ["--neon" as string]: "rgba(244,63,94,0.55)" }}
                      className="ml-auto max-w-[55%] animate-text-glow-breath truncate text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      {r.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SUCCESS MODAL */}
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
            <div key={runId} className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Batch released
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {toast.ok} item{toast.ok !== 1 ? "s" : ""} released{toast.fail > 0 && ` · ${toast.fail} failed`}
              </p>
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => setToast(null)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
