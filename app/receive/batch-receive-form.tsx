"use client";

import { useState, useTransition } from "react";
import { receiveBatchAction, type BatchActionResult } from "@/app/actions/inventory";
import { ModelCombobox } from "@/components/model-combobox";

type RowResult = { serial: string; ok: boolean; error?: string };

export function BatchReceiveForm({
  models,
}: {
  models: { id: string; type: string; model: string; brand: string; category: string }[];
}) {
  const [modelId, setModelId] = useState("");
  const location = "IT Store";
  const [poNumber, setPoNumber] = useState("PTCAP__");
  const [remarks, setRemarks] = useState("");
  const [raw, setRaw] = useState("");
  const [pending, start] = useTransition();
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const count = lines.length;

  function process() {
    setError(null);
    setResults(null);
    if (!modelId) {
      setError("Pilih model dulu.");
      return;
    }
    if (count === 0) {
      setError("Masukkan minimal 1 serial number.");
      return;
    }
    start(async () => {
      const res = (await receiveBatchAction({
        modelId,
        poNumber,
        location,
        remarks,
        lines,
      })) as BatchActionResult;
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.results);
    });
  }

  return (
    <div className="max-w-lg space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Item Type / Model
        </label>
        <ModelCombobox models={models} value={modelId} onChange={setModelId} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Serial Numbers
          <span className="font-normal text-slate-400">
            (Insert 1 serial number per line)
          </span>
        </label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value.toUpperCase())}
          rows={10}
          placeholder={"SN-LAP-001\nSN-LAP-002\nSN-LAP-003\netc.."}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <p className="mt-1 text-xs text-slate-400">Total {count} SN</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            PO Number
          </label>
          <input
            value={poNumber}
            readOnly
            tabIndex={-1}
            className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500"
          />
          <input type="hidden" name="poNumber" value={poNumber} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Location
          </label>
          <input
            value={location}
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500"
          />
          <input type="hidden" name="location" value={location} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Remarks (shared)
        </label>
        <input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      <button
        onClick={process}
        disabled={pending || count === 0 || !modelId}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? `Processing ${count} items…` : `Process ${count} item${count === 1 ? "" : "s"}`}
      </button>

      {results && (
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <span>Results</span>
            <span>
              {results.filter((r) => r.ok).length} ok · {results.filter((r) => !r.ok).length} failed
            </span>
          </div>
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {results.map((r, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={
                    r.ok
                      ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                  }
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
                  <span className="ml-auto text-xs text-rose-600 dark:text-rose-400">{r.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
