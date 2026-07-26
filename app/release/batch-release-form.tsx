"use client";

import { useState, useRef } from "react";
import { releaseBatchAction, type BatchActionResult } from "@/app/actions/inventory";
import { SectionCombobox } from "@/components/section-combobox";
import { HOSTNAME_TYPES } from "@/lib/types";

export function BatchReleaseForm() {
  const [pending, setPending] = useState(false);
  const [serials, setSerials] = useState("");
  const [results, setResults] = useState<BatchActionResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [dept, setDept] = useState("");
  const [hostname, setHostname] = useState("BAL");
  const [empNumber, setEmpNumber] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [gid, setGid] = useState("");
  const [email, setEmail] = useState("");

  const HOSTNAME_PREFIX = "BAL";
  function onHostnameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    setHostname(v.startsWith(HOSTNAME_PREFIX) ? v : HOSTNAME_PREFIX + v.replace(/BAL/g, ""));
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
    try {
      const res = await releaseBatchAction({
        serials: list,
        assigneeEmpNumber: empNumber,
        assigneeName,
        assigneeDept: dept,
        gid,
        email,
        hostname,
      });
      setResults(res);
      setRunId((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* LEFT: inputs */}
      <form onSubmit={onSubmit} className="w-full max-w-lg shrink-0 space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Serial Numbers <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={serials}
            onChange={(e) => setSerials(e.target.value)}
            required
            rows={6}
            placeholder="Paste serial numbers, one per line&#10;SN-001&#10;SN-002&#10;SN-003"
            className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {serials.trim() && (
            <p className="mt-1 text-xs text-slate-400">
              {serials.split("\n").filter((s) => s.trim()).length} serial(s)
            </p>
          )}
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
              onChange={(e) => setAssigneeName(e.target.value)}
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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Hostname (for PC/Laptop/Tablet)</label>
          <input
            value={hostname}
            onChange={onHostnameChange}
            placeholder="BAL"
            className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          disabled={pending || !serials.trim()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending
            ? "Releasing…"
            : `Release ${serials.split("\n").filter((s) => s.trim()).length || 0} Items`}
        </button>
        {results && !results.ok && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{results.error}</p>
        )}
      </form>

      {/* RIGHT: results panel */}
      <div className="hidden flex-1 min-w-0 lg:block lg:sticky lg:top-6">
        {results?.ok && results.results && (
          <div
            key={runId}
            className="animate-panel-in overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <span>Results</span>
              <span>
                {results.results.filter((r) => r.ok).length} ok · {results.results.filter((r) => !r.ok).length} failed
              </span>
            </div>
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto text-sm dark:divide-slate-800">
              {results.results.map((r, i) => (
                <li
                  key={i}
                  className="flex animate-fade-in items-center gap-3 px-4 py-2.5"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {r.ok ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 shrink-0 text-emerald-500" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 shrink-0 text-rose-500" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{r.serial}</span>
                  {!r.ok && <span className="ml-auto text-xs text-rose-500">{r.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
