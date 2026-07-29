"use client";

import { useState } from "react";
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

const headers = [
  { key: "emp", label: "Emp" },
  { key: "pic", label: "PIC Name" },
  { key: "gid", label: "GID" },
  { key: "email", label: "Email" },
  { key: "hostname", label: "Hostname" },
  { key: "sn", label: "SN" },
  { key: "type", label: "Type" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "section", label: "Section" },
  { key: "remarks", label: "Remarks" },
  { key: "status", label: "Status" },
];

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const [q, setQ] = useState("");
  const filtered = q
    ? rows.filter((r) =>
        [r.empNumber, r.picName, r.gid, r.email, r.hostname, r.serialNumber, r.type, r.brand, r.model, r.section, r.remarks, r.status]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : rows;

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
            <p className="text-xs text-slate-400 dark:text-slate-500">{rows.length} device{rows.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search with clear X */}
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
              placeholder="Search by hostname, SN, PIC…"
              className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
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
      <div className="overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/60">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
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
                      r.status === "RELEASED" ? "bg-indigo-500" :
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
                <td colSpan={headers.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 9h8M8 13h8M8 17h5" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No devices match your search.</p>
                    <button onClick={() => setQ("")} className="text-xs text-[#066fd1] hover:underline">Clear search</button>
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
