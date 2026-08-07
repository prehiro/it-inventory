"use client";

import { useState } from "react";
import { exportAvailableStockAction } from "@/app/actions/export";

/**
 * Export Excel button — used on the Received Item page table toolbar.
 * Mirrors the PC Ledger "Export" action: green button, shiny glass sweep,
 * spring-bounce "Export to Excel" tooltip on hover.
 *
 * Exports exactly what the current table shows: the active filter is
 * forwarded to the server action so the workbook matches the filtered
 * result set (and the tooltip shows how many rows will be exported).
 */
export function ExportExcelButton({
  statuses,
  filter,
  count,
  sheetTitle = "Received Item",
  filename = "it-inventory-received-item.xlsx",
  subtitle = "Available & ready-to-release inventory",
}: {
  statuses?: string[];
  filter?: { type?: string; category?: string; q?: string; po?: string; location?: string; from?: string; to?: string; assignee?: string; hostname?: string; status?: string; reason?: string; brandModel?: string };
  count?: number;
  sheetTitle?: string;
  filename?: string;
  subtitle?: string;
}) {
  const [busy, setBusy] = useState<"" | "xlsx">("");

  async function download() {
    setBusy("xlsx");
    const res = await exportAvailableStockAction({
      statuses: statuses ?? ["AVAILABLE"],
      type: filter?.type ?? "",
      category: filter?.category ?? "",
      q: filter?.q ?? "",
      po: filter?.po ?? "",
      location: filter?.location ?? "",
      from: filter?.from ?? "",
      to: filter?.to ?? "",
      assigneeDept: filter?.location ?? "", // released: location = assignee dept
      assigneeName: filter?.assignee ?? "",
      hostname: filter?.hostname ?? "",
      status: filter?.status ?? "",
      reason: filter?.reason ?? "",
      brandModel: filter?.brandModel ?? "",
      sheetTitle,
      subtitle,
      filename,
    });
    setBusy("");
    if (!res.ok) {
      alert(res.error);
      return;
    }
    const a = document.createElement("a");
    a.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.data}`;
    a.download = res.filename;
    a.click();
  }

  return (
    <div className="group relative">
      <button
        type="button"
        disabled={busy !== ""}
        onClick={() => download()}
        aria-label="Export to Excel"
        className="relative inline-flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-lg bg-green-700 text-white shadow-sm transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-60 disabled:hover:bg-green-700"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 ease-out -translate-x-[250%] group-hover:translate-x-[250%] group-hover:opacity-100"
        />
        {busy === "xlsx" ? (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0" aria-hidden="true">
            <rect width="32" height="32" rx="6.5" fill="#217346" />
            <path fill="#ffffff" d="M29.121 8.502v-3.749h-8.435v3.749zM29.121 15.063v-4.686h-8.435v4.686zM29.121 21.623v-4.686h-8.435v4.686zM29.121 27.247v-3.749h-8.435v3.749zM18.812 8.502v-3.749h-8.435v3.749zM18.812 15.063v-4.686h-2.812v4.686zM18.812 21.623v-4.686h-2.812v4.686zM18.812 27.247v-3.749h-8.435v3.749zM8.502 17.6l1.774 3.324h2.674l-2.974-4.836 2.924-4.749h-2.574l-1.625 2.999-0.062 0.1-0.050 0.112-0.8-1.6-0.825-1.612h-2.724l2.837 4.774-3.099 4.811h2.699z" />
          </svg>
        )}
      </button>

      {/* Hover tooltip — spring bounce pop (below button, never clipped) */}
      <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2">
        <div
          className="relative origin-top -translate-y-1.5 scale-90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="absolute bottom-full left-1/2 mb-1 h-2 w-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-slate-900 ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50" />
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xl ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5 text-emerald-400" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {busy === "xlsx"
              ? "Exporting…"
              : count !== undefined
                ? `Export ${count.toLocaleString()} item${count === 1 ? "" : "s"}`
                : "Export to Excel"}
          </div>
        </div>
      </div>
    </div>
  );
}
