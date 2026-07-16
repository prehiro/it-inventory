"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { receiveAction, type ActionResult } from "@/app/actions/inventory";
import { ModelCombobox } from "@/components/model-combobox";

export function ReceiveForm({ models }: { models: { id: string; type: string; model: string; brand: string; category: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => receiveAction(Object.fromEntries(formData.entries())),
    null,
  );
  const [modelId, setModelId] = useState("");
  const [po, setPo] = useState("PTCAP__");
  const [snExists, setSnExists] = useState(false);
  const [snChecking, setSnChecking] = useState(false);
  const [snValue, setSnValue] = useState("");
  const [received, setReceived] = useState<string | null>(null);
  const snTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PO_PREFIX = "PTCAP__";
  function onPoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPo(v.startsWith(PO_PREFIX) ? v : PO_PREFIX + v.replace(/PTCAP__/g, ""));
  }

  function onSerialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    e.target.value = v;
    setSnValue(v);
    setSnExists(false);
    setReceived(null);
    const sn = v.trim();
    if (snTimer.current) clearTimeout(snTimer.current);
    if (sn.length === 0) {
      setSnChecking(false);
      return;
    }
    setSnChecking(true);
    const ctrl = new AbortController();
    snTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/item/exists?serial=${encodeURIComponent(sn)}`, {
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { exists: boolean };
        setSnExists(data.exists);
      } catch {
        setSnExists(false);
      } finally {
        setSnChecking(false);
      }
    }, 300);
  }

  useEffect(() => {
    if (state?.ok) {
      const m = models.find((x) => x.id === modelId);
      const label = m ? `${m.type} ${m.brand} ${m.model}`.toUpperCase() : "ITEM";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceived(`${label} SN:${snValue.trim() || "—"}`);
      // reset fields so the user is ready for the next item
      setModelId("");
      setSnValue("");
      setSnExists(false);
      setSnChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const dupError = state && !state.ok && state.duplicateSerial ? state.error : null;
  const showSnError = snExists || !!dupError;

  return (
    <form
      action={formAction}
      className={`max-w-lg space-y-5 rounded-2xl bg-white p-7 shadow-sm ring-1 transition dark:bg-slate-900 ${
        showSnError
          ? "border border-rose-400 ring-rose-400/40 dark:border-rose-500/60 dark:ring-rose-500/30"
          : "ring-slate-200 dark:ring-slate-800"
      }`}
    >
      <input type="hidden" name="modelId" value={modelId} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Item Type / Model</label>
        <ModelCombobox
          models={models}
          value={modelId}
          onChange={setModelId}
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
          {snChecking && (
            <span className="text-xs text-slate-400">checking…</span>
          )}
          {showSnError && (
            <span
              style={{ ["--neon" as string]: "rgba(244,63,94,0.55)" }}
              className="inline-flex animate-text-glow-breath items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              <span
                style={{ ["--neon" as string]: "rgba(244,63,94,0.55)" }}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 animate-status-breath dark:bg-rose-500/15 dark:text-rose-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </span>
              {dupError ?? "Serial Number already exists"}
            </span>
          )}
        </div>
        <input name="serialNumber" required value={snValue} onChange={onSerialChange} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-1 dark:bg-slate-800 dark:text-slate-100 ${
          showSnError
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500/60"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700"
        }`} placeholder="SN-..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">PO Number</label>
          <input
            value={po}
            onChange={onPoChange}
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input type="hidden" name="poNumber" value={po} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
          <input
            value="IT Store"
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500"
          />
          <input type="hidden" name="location" value="IT Store" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
        <input name="remarks" onChange={(e) => { e.target.value = e.target.value; }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      {state && !state.ok && !state.duplicateSerial && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{state.error}</p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Receive Item"}
      </button>
      {received && (
        <div className="animate-panel-in flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
          <div
            style={{ ["--neon" as string]: "rgba(16,185,129,0.55)" }}
            className="flex h-8 w-8 shrink-0 animate-check-pop animate-status-breath items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path className="animate-check-draw" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Item received</p>
            <p className="truncate font-mono text-xs text-emerald-700/80 dark:text-emerald-400/80">{received}</p>
          </div>
        </div>
      )}
    </form>
  );
}
