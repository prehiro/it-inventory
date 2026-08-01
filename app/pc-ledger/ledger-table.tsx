"use client";

import { useState, useMemo } from "react";
import { statusLabel } from "@/lib/types";

export type LedgerRow = {
  empNumber: string;
  picName: string;
  gid: string;
  email: string;
  hostname: string;
  serialNumber: string;
  type: string;
  brand: string;
  model: string;
  section: string;
  remarks: string;
  status: string;
};

const STATUS_TONE: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400",
  DEPLOYED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-400",
  RETURNED_KEEP: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400",
  IN_REPAIR: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400",
  DISPOSED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-400",
};

const COLUMNS = [
  { key: "empNumber", label: "Emp" },
  { key: "picName", label: "PIC Name" },
  { key: "gid", label: "GID" },
  { key: "email", label: "Email" },
  { key: "hostname", label: "Hostname" },
  { key: "serialNumber", label: "SN" },
  { key: "type", label: "Type" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "section", label: "Section" },
  { key: "remarks", label: "Remarks" },
  { key: "status", label: "Status" },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

type Filters = Record<string, string>;

function matchesAll(row: LedgerRow, filters: Filters): boolean {
  for (const [key, val] of Object.entries(filters)) {
    if (!val) continue;
    const cell = (row as any)[key]?.toString().toLowerCase() ?? "";
    if (!cell.includes(val.toLowerCase())) return false;
  }
  return true;
}

function getUniqueValues(rows: LedgerRow[], key: ColKey): string[] {
  const set = new Set(rows.map((r) => (r as any)[key]?.toString() ?? ""));
  return Array.from(set).sort();
}

const FILTER_INPUT_CLASS =
  "w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const types = useMemo(() => getUniqueValues(rows, "type"), [rows]);
  const statuses = useMemo(() => getUniqueValues(rows, "status"), [rows]);

  const filtered = useMemo(() => {
    let data = rows;
    // Global search
    if (q) {
      data = data.filter((r) =>
        Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()),
      );
    }
    // Column filters
    data = data.filter((r) => matchesAll(r, filters));
    return data;
  }, [rows, q, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  function setFilter(key: string, val: string) {
    setFilters((prev) => {
      const next = { ...prev };
      if (val) next[key] = val;
      else delete next[key];
      return next;
    });
  }

  function clearAllFilters() {
    setFilters({});
  }

  return (
    <div className="-mx-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Device Inventory</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {filtered.length} device{filtered.length === 1 ? "" : "s"}
              {hasActiveFilters && ` (filtered from ${rows.length})`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search all…"
              className="w-48 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              showFilters || hasActiveFilters
                ? "border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-slate-400 underline-offset-2 hover:text-rose-500 hover:underline dark:text-slate-500"
            >
              Clear
            </button>
          )}

          {/* Export */}
          <a
            href="/api/pc-ledger/export"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </a>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-auto custom-scrollbar" style={{ maxHeight: "calc(100vh - 13.5rem)" }}>
        <table className="w-full border-collapse text-sm">
          {/* Header row */}
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/60">
              {COLUMNS.map((col) => {
                const isActive = !!filters[col.key];
                return (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                      isActive
                        ? "text-[#2563eb]"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {isActive && (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-[#2563eb]">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Filter row */}
            {showFilters && (
              <tr className="border-b border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900">
                {COLUMNS.map((col) => {
                  const val = filters[col.key] ?? "";
                  const isDropdown = col.key === "type" || col.key === "status";
                  const options = col.key === "type" ? types : col.key === "status" ? statuses : [];

                  if (isDropdown) {
                    return (
                      <th key={col.key} className="px-2 py-2">
                        <select
                          value={val}
                          onChange={(e) => setFilter(col.key, e.target.value)}
                          className={`${FILTER_INPUT_CLASS} min-w-0`}
                        >
                          <option value="">All</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {col.key === "status" ? statusLabel(opt) : opt}
                            </option>
                          ))}
                        </select>
                      </th>
                    );
                  }

                  return (
                    <th key={col.key} className="px-2 py-2">
                      <input
                        value={val}
                        onChange={(e) => setFilter(col.key, e.target.value)}
                        placeholder="Filter…"
                        className={FILTER_INPUT_CLASS}
                      />
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>

          {/* Body */}
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.serialNumber}
                className={`border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/40 ${
                  i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-800/20"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{r.empNumber}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{r.picName}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{r.gid}</td>
                <td className="max-w-[180px] truncate whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400" title={r.email}>{r.email}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{r.hostname}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{r.serialNumber}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">{r.type}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{r.brand}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{r.model}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{r.section}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-400 dark:text-slate-500" title={r.remarks}>{r.remarks || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONE[r.status] ?? ""}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      r.status === "AVAILABLE" ? "bg-emerald-500" :
                      r.status === "DEPLOYED" ? "bg-indigo-500" :
                      r.status === "RETURNED_KEEP" ? "bg-blue-500" :
                      r.status === "IN_REPAIR" ? "bg-amber-500" :
                      "bg-rose-500"
                    }`} />
                    {statusLabel(r.status)}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 9h8M8 13h8M8 17h5" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No devices match your filters.</p>
                    <button
                      onClick={() => { setFilters({}); setQ(""); }}
                      className="text-xs font-medium text-[#2563eb] hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
