"use client";

import { useState } from "react";

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

  const headers = [
    "Emp Number", "PIC Name", "GID", "Email", "Hostname", "SN",
    "Type", "Brand", "Model", "Section", "Remarks", "Status",
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {rows.length} device{rows.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <a
            href="/api/pc-ledger/export"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Export Excel
          </a>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.serialNumber} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <td className="px-3 py-2.5 font-mono text-xs">{r.empNumber}</td>
                <td className="px-3 py-2.5">{r.picName}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.gid}</td>
                <td className="px-3 py-2.5 text-xs">{r.email}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.hostname}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.serialNumber}</td>
                <td className="px-3 py-2.5">{r.type}</td>
                <td className="px-3 py-2.5">{r.brand}</td>
                <td className="px-3 py-2.5">{r.model}</td>
                <td className="px-3 py-2.5">{r.section}</td>
                <td className="px-3 py-2.5 max-w-[200px] truncate" title={r.remarks}>{r.remarks}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONE[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-3 py-10 text-center text-slate-400">
                  No devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
