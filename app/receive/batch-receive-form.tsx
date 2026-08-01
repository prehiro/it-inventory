"use client";

import { useState, useEffect, useTransition, useRef, useMemo } from "react";
import { receiveBatchAction, type BatchActionResult } from "@/app/actions/inventory";
import { ModelSearchBar, ModelCardList } from "./model-selector-grid";
import { TypeIcon } from "./model-selector-grid";

type RowResult = { serial: string; ok: boolean; error?: string };

export function BatchReceiveForm({
  models,
}: {
  models: { id: string; type: string; model: string; brand: string; category: string }[];
}) {
  const [modelId, setModelId] = useState("");
  const [step, setStep] = useState<"select" | "form">("select");
  const [formKey, setFormKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedModel = models.find((m) => m.id === modelId);

  const filteredCount = useMemo(() => {
    if (!searchQuery.trim()) return models.length;
    const q = searchQuery.toLowerCase();
    return models.filter(
      (m) =>
        m.type.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    ).length;
  }, [models, searchQuery]);

  function handleSelect(id: string) {
    setModelId(id);
    setFormKey((k) => k + 1);
    setStep("form");
  }

  function handleBack() {
    setStep("select");
    setModelId("");
  }

  if (step === "select") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Choose Item Type &amp; Model
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Select the model you&apos;re receiving
              </p>
            </div>
            <div className="w-full sm:min-w-[340px] sm:w-auto">
              <ModelSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={filteredCount}
              />
            </div>
          </div>
        </div>
        <div className="p-5 pt-0">
          <div className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            <ModelCardList models={models} searchQuery={searchQuery} onSelect={handleSelect} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BatchReceiveFormInner
      key={formKey}
      modelId={modelId}
      modelLabel={selectedModel ? `${selectedModel.type} — ${selectedModel.brand} ${selectedModel.model}` : ""}
      modelType={selectedModel?.type ?? ""}
      modelCategory={selectedModel?.category ?? "FA"}
      onBack={handleBack}
    />
  );
}

function BatchReceiveFormInner({
  modelId,
  modelLabel,
  modelType,
  modelCategory,
  onBack,
}: {
  modelId: string;
  modelLabel: string;
  modelType: string;
  modelCategory: string;
  onBack: () => void;
}) {
  const location = "IT Store";
  const PO_PREFIX = "PTCAP__";
  const [poNumber, setPoNumber] = useState("PTCAP__");
  const [remarks, setRemarks] = useState("");
  const [raw, setRaw] = useState("");
  const [pending, start] = useTransition();
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [runId, setRunId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: number; fail: number } | null>(null);
  const snInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus SN textarea on mount
  useEffect(() => {
    snInputRef.current?.focus();
  }, []);

  // Refocus SN textarea after modal dismissed
  useEffect(() => {
    if (!toast) {
      const id = setTimeout(() => snInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [toast]);

  function handleDismissToast() {
    setToast(null);
    // Reset input fields but keep results panel visible
    setPoNumber("PTCAP__");
    setRemarks("");
    setRaw("");
    setError(null);
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function onPoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPoNumber(v.startsWith(PO_PREFIX) ? v : PO_PREFIX + v.replace(/PTCAP__/g, ""));
  }

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const count = lines.length;

  function process() {
    setError(null);
    setResults(null);
    setToast(null);
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
      setRunId((n) => n + 1);
      const ok = res.results.filter((r) => r.ok).length;
      const fail = res.results.filter((r) => !r.ok).length;
      setToast({ ok, fail });
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* LEFT: input form */}
      <div className="w-full max-w-lg shrink-0 animate-fade-in space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {/* Selected model pill + back */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
            modelCategory === "NCA" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
            : modelCategory === "GENERAL" ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          }`}
          style={{ "--neon": modelCategory === "NCA" ? "rgba(245,158,11,0.55)" : modelCategory === "GENERAL" ? "rgba(147,51,234,0.55)" : "rgba(16,185,129,0.55)" } as React.CSSProperties}>
            <TypeIcon type={modelType} className="h-3.5 w-3.5 animate-icon-breath" />
            {modelLabel}
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Serial Numbers
            <span className="font-normal text-slate-400"> (1 per line)</span>
          </label>
          <textarea ref={snInputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value.toUpperCase())}
            rows={8}
            placeholder={"SN-LAP-001\nSN-LAP-002\nSN-LAP-003\netc.."}
            className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-400">Total {count} SN</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">PO Number</label>
            <input value={poNumber} onChange={onPoChange}
              onKeyDown={(e) => {
                const el = e.currentTarget;
                const atPrefix = el.selectionStart !== null && el.selectionStart <= PO_PREFIX.length && el.selectionEnd !== null && el.selectionEnd <= PO_PREFIX.length;
                if ((e.key === "Backspace" || e.key === "Delete") && atPrefix) e.preventDefault();
              }}
              onPaste={(e) => {
                const el = e.currentTarget;
                if (el.selectionStart !== null && el.selectionStart < PO_PREFIX.length) e.preventDefault();
              }}
              placeholder="PTCAP__"
              style={{ ["--neon" as string]: "rgba(37,99,235,0.55)" }}
              className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input type="hidden" name="poNumber" value={poNumber} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
            <input value={location} disabled className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500" />
            <input type="hidden" name="location" value={location} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks (shared)</label>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ ["--neon" as string]: "rgba(37,99,235,0.55)" }} className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
        )}

        <button
          onClick={process}
          disabled={pending || count === 0}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {pending ? `Processing ${count} items…` : `Process ${count} item${count === 1 ? "" : "s"}`}
        </button>
      </div>

      {/* RIGHT: results panel */}
      <div className="hidden flex-1 min-w-0 lg:block lg:sticky lg:top-6">
        {results && (
          <div key={runId} className="animate-panel-in overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <span>Results</span>
              <span>{results.filter((r) => r.ok).length} ok · {results.filter((r) => !r.ok).length} failed</span>
            </div>
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto text-sm dark:divide-slate-800">
              {results.map((r, i) => (
                <li key={i} className="flex animate-fade-in items-center gap-3 px-4 py-2.5" style={{ animationDelay: `${Math.min(i, 20) * 35}ms`, animationFillMode: "both" }}>
                  <span className={r.ok ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 animate-status-breath dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 animate-status-breath dark:bg-rose-500/15 dark:text-rose-400"}
                    style={r.ok ? { ["--neon" as string]: "rgba(16,185,129,0.55)" } : { ["--neon" as string]: "rgba(244,63,94,0.55)" }}>
                    {r.ok ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    )}
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{r.serial}</span>
                  {!r.ok && (
                    <span title={r.error} style={{ ["--neon" as string]: "rgba(244,63,94,0.55)" }} className="ml-auto max-w-[55%] animate-text-glow-breath truncate text-xs font-medium text-rose-600 dark:text-rose-400">{r.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SUCCESS MODAL */}
      {toast && (
        <div onClick={handleDismissToast} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50">
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div key={runId} className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Batch received</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.ok} item{toast.ok !== 1 ? "s" : ""} received{toast.fail > 0 && ` · ${toast.fail} failed`}</p>
              <div className="mt-5 flex justify-center">
                <button onClick={handleDismissToast} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
