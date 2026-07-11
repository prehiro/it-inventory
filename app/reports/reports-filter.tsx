"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { exportExcelAction, exportPdfAction } from "@/app/actions/export";

export function ReportsFilter({
  initial,
  count,
}: {
  initial: { type: string; status: string; from: string; to: string };
  count: number;
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type);
  const [status, setStatus] = useState(initial.status);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<"" | "xlsx" | "pdf">("");

  function apply() {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    router.push(`/reports?${p.toString()}`);
  }

  async function download(kind: "xlsx" | "pdf") {
    setBusy(kind);
    const filter = { type, status, from, to };
    const res = kind === "xlsx" ? await exportExcelAction(filter) : await exportPdfAction(filter);
    setBusy("");
    if (!res.ok) { alert(res.error); return; }
    const a = document.createElement("a");
    a.href = `data:application/${kind === "xlsx" ? "vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "pdf"};base64,${res.data}`;
    a.download = res.filename;
    a.click();
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <option value="">All</option>
          <option value="RECEIVE">Received</option>
          <option value="RELEASE">Released</option>
          <option value="RETURN">Returned</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <option value="">All</option>
          <option value="AVAILABLE">Available</option>
          <option value="DEPLOYED">Deployed</option>
          <option value="RETURNED_KEEP">Returned</option>
          <option value="IN_REPAIR">In Repair</option>
          <option value="DISPOSED">Disposed</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <button onClick={apply} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
        Apply
      </button>
      <span className="text-sm text-slate-400 dark:text-slate-500">{count} rows</span>
      <div className="ml-auto flex gap-2">
        <button disabled={busy !== ""} onClick={() => download("xlsx")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          {busy === "xlsx" ? "…" : "Export Excel"}
        </button>
        <button disabled={busy !== ""} onClick={() => download("pdf")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          {busy === "pdf" ? "…" : "Export PDF"}
        </button>
      </div>
    </div>
  );
}
