"use client";

import { useActionState, useEffect, useState, useRef, useMemo } from "react";
import { receiveAction, type ActionResult, type RepairRestoreResult } from "@/app/actions/inventory";
import { ModelSearchBar, ModelCardList } from "./model-selector-grid";
import { TypeIcon } from "./model-selector-grid";

export function ReceiveForm({ models }: { models: { id: string; type: string; model: string; brand: string; category: string }[] }) {
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
    <ReceiveFormInner
      key={formKey}
      modelId={modelId}
      modelLabel={selectedModel ? `${selectedModel.type} — ${selectedModel.brand} ${selectedModel.model}` : ""}
      modelType={selectedModel?.type ?? ""}
      modelCategory={selectedModel?.category ?? "FA"}
      onBack={handleBack}
    />
  );
}

function ReceiveFormInner({
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
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => receiveAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [po, setPo] = useState("PTCAP__");
  const [remarks, setRemarks] = useState("");
  const [snExists, setSnExists] = useState(false);
  const [snChecking, setSnChecking] = useState(false);
  const [snValue, setSnValue] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const snTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus serial input on mount
  useEffect(() => {
    snInputRef.current?.focus();
  }, []);

  // Refocus SN input after modal dismissed
  useEffect(() => {
    if (!toast) {
      // Small delay so React finishes re-render before focusing
      const id = setTimeout(() => snInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [toast]);

  const [repairInfo, setRepairInfo] = useState<{ itemId: string; serial: string } | null>(null);
  const [repairRestoring, setRepairRestoring] = useState(false);
  const [repairDone, setRepairDone] = useState(false);

  const PO_PREFIX = "PTCAP__";

  function handleDismissToast() {
    setToast(null);
    setSnValue("");
    setSnExists(false);
    setSnChecking(false);
    setRemarks("");
    setRepairInfo(null);
    setRepairDone(false);
    setPo("PTCAP__");
  }

  function onPoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPo(v.startsWith(PO_PREFIX) ? v : PO_PREFIX + v.replace(/PTCAP__/g, ""));
  }

  function onSerialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    e.target.value = v;
    setSnValue(v);
    setSnExists(false);
    setRepairInfo(null);
    setRepairDone(false);
    const sn = v.trim();
    if (snTimer.current) clearTimeout(snTimer.current);
    if (sn.length === 0) {
      setSnChecking(false);
      return;
    }
    setSnChecking(true);
    snTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/item/exists?serial=${encodeURIComponent(sn)}`);
        const data = (await res.json()) as { exists: boolean; status: string | null; item: { id: string } | null };
        if (data.exists && data.status === "IN_REPAIR" && data.item) {
          setRepairInfo({ itemId: data.item.id, serial: sn });
          setSnExists(false);
        } else {
          setSnExists(data.exists);
        }
      } catch {
        setSnExists(false);
      } finally {
        setSnChecking(false);
      }
    }, 300);
  }

  async function handleRepairYes() {
    if (!repairInfo) return;
    setRepairRestoring(true);
    try {
      const res = (await fetch("/api/repair/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: repairInfo.itemId }),
      }).then((r) => r.json())) as RepairRestoreResult;
      if (res.ok) {
        setRepairDone(true);
        setRepairInfo(null);
      } else {
        alert(res.error || "Failed to restore item");
      }
    } catch {
      alert("Failed to restore item");
    } finally {
      setRepairRestoring(false);
    }
  }

  useEffect(() => {
    if (state?.ok) {
      const label = modelLabel.toUpperCase();
      setToast(label);
      setSnValue("");
      setSnExists(false);
      setSnChecking(false);
      setRemarks("");
      setRepairInfo(null);
      setRepairDone(false);
      setPo("PTCAP__");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const dupError = state && !state.ok && state.duplicateSerial ? state.error : null;
  const showSnError = snExists || !!dupError;

  return (
    <>
      <form
        action={formAction}
        className={`max-w-lg rounded-2xl bg-white p-7 shadow-sm ring-1 transition animate-fade-in dark:bg-slate-900 ${showSnError
            ? "border border-rose-400 ring-rose-400/40 dark:border-rose-500/60 dark:ring-rose-500/30"
            : "ring-slate-200 dark:ring-slate-800"
          }`}
      >
        <input type="hidden" name="modelId" value={modelId} />

        <div className="mb-5 flex items-center gap-2">
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

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
              {snChecking && <span className="text-xs text-slate-400">checking…</span>}
              {showSnError && (
                <span style={{ ["--neon" as string]: "rgba(244,63,94,0.55)" }} className="inline-flex animate-text-glow-breath items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  <span style={{ ["--neon" as string]: "rgba(244,63,94,0.55)" }} className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 animate-status-breath dark:bg-rose-500/15 dark:text-rose-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </span>
                  {dupError ?? "Serial Number already exists"}
                </span>
              )}
              {repairInfo && !repairDone && (
                <span style={{ ["--neon" as string]: "rgba(245,158,11,0.55)" }} className="inline-flex animate-text-glow-breath items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <span style={{ ["--neon" as string]: "rgba(245,158,11,0.55)" }} className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  </span>
                  Item in repair
                </span>
              )}
            </div>
            <input ref={snInputRef} name="serialNumber" required value={snValue} onChange={onSerialChange} disabled={!!repairInfo && !repairDone} style={{ ["--neon" as string]: "rgba(6,111,209,0.55)" }} className={`${showSnError ? "input-glow-error" : repairInfo && !repairDone ? "input-glow-amber" : "input-glow"} w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-0 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50 ${showSnError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500/60"
                : repairInfo && !repairDone ? "border-amber-400 focus:border-amber-500 dark:border-amber-500/60"
                  : "border-slate-300 focus:border-[#066fd1] dark:border-slate-700"
              }`} placeholder="SN-..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">PO Number</label>
              <input value={po} onChange={onPoChange}
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
                style={{ ["--neon" as string]: "rgba(6,111,209,0.55)" }}
                className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input type="hidden" name="poNumber" value={po} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
              <input value="IT Store" disabled className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500" />
              <input type="hidden" name="location" value="IT Store" />
            </div>
          </div>

          {!repairInfo && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
              <input name="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ ["--neon" as string]: "rgba(6,111,209,0.55)" }} className="input-glow w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
          )}

          {state && !state.ok && !state.duplicateSerial && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>
          )}

          <button disabled={pending} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
            {pending ? "Saving…" : "Receive Item"}
          </button>
        </div>
      </form>

      {toast && (
        <div onClick={handleDismissToast} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50">
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Item received</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast}</p>
              <div className="mt-5 flex justify-center">
                <button onClick={handleDismissToast} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {repairInfo && !repairDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50">
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Item in Repair</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-mono text-amber-600 dark:text-amber-400">{repairInfo.serial}</span> is currently <span className="font-medium">IN_REPAIR</span>. Has the repair been completed?
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setRepairInfo(null)} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">No</button>
                <button onClick={handleRepairYes} disabled={repairRestoring} className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60">
                  {repairRestoring ? "Restoring…" : "Yes, Repair Done"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {repairDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50">
          <div onClick={() => setRepairDone(false)} role="dialog" aria-modal="true" className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Repair Completed</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Item is now <span className="font-medium text-emerald-600 dark:text-emerald-400">AVAILABLE</span> and ready to release.</p>
              <div className="mt-6 flex justify-center">
                <button onClick={() => setRepairDone(false)} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
