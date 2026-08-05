"use client";

import { useState } from "react";
import { ExportExcelButton } from "./export-excel-button";
import { TableFilterRow } from "./table-filter-row";
import { ReportsPagination } from "./reports-pagination";
import { CategoryBadge } from "./category-badge";
import { CellTooltip } from "./cell-tooltip";

/* ──────────────────────────────────────────
   ReceivedItemsTable — full table card (toolbar + sticky thead w/ filter row
   + grouped body + pagination). Mirrors PC Ledger architecture:
   server fetches, client renders & filters.
   ────────────────────────────────────────── */

export type ReceivedRow = {
  serialNumber: string;
  poNumber: string | null;
  location: string;
  dateReceived: Date;
  model: { type: string; brand: string; model: string; category: string };
};

const TYPE_BADGE = (cat: string) =>
  cat === "FA"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400"
    : cat === "NCA"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/15 dark:text-purple-400";

function groupByDay(items: ReceivedRow[]) {
  const groups: { key: string; date: Date; items: ReceivedRow[] }[] = [];
  for (const i of items) {
    const d = new Date(i.dateReceived.getFullYear(), i.dateReceived.getMonth(), i.dateReceived.getDate());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(i);
    else groups.push({ key, date: d, items: [i] });
  }
  return groups;
}

function GroupRows({ group }: { group: { key: string; date: Date; items: ReceivedRow[] } }) {
  const dayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const today = new Date();
  const isToday =
    group.date.getFullYear() === today.getFullYear() &&
    group.date.getMonth() === today.getMonth() &&
    group.date.getDate() === today.getDate();
  return (
    <>
      <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/40">
        <td colSpan={8} className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            {isToday && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Today
              </span>
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {dayFmt.format(group.date)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {group.items.length} item{group.items.length === 1 ? "" : "s"}
            </span>
          </div>
        </td>
      </tr>
      {group.items.map((i, idx) => (
        <tr
          key={i.serialNumber}
          className={`border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/40 ${
            idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-800/20"
          }`}
        >
          <td className="max-w-0 px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">
            <CellTooltip
              label={<span className="block truncate">{i.serialNumber}</span>}
              content={<span className="font-mono text-[11px] leading-relaxed">{i.serialNumber}</span>}
              width={240}
            />
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
              <CellTooltip
                label={
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_BADGE(i.model.category)}`}
                  >
                    {i.model.type}
                  </span>
                }
                content={
                  <span className="block">
                    <span className="font-medium text-white">Type: {i.model.type}</span>
                    <span className="mt-1 block text-[11px] text-slate-300 dark:text-slate-300">Device type for this item</span>
                  </span>
                }
                width={240}
              />
            </td>
          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{i.model.brand}</td>
          <td className="max-w-0 px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
            <CellTooltip
              label={<span className="block truncate">{i.model.model}</span>}
              content={<span className="block font-medium text-white">{i.model.model}</span>}
              width={260}
            />
          </td>
          <td className="whitespace-nowrap px-4 py-3">
            <CategoryBadge category={i.model.category} />
          </td>
          <td className="max-w-0 px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
            <CellTooltip
              label={<span className="block truncate">{i.poNumber || "—"}</span>}
              content={<span className="block text-[11px] text-slate-200">{i.poNumber || "No PO"}</span>}
              width={240}
            />
          </td>
          <td className="max-w-0 px-4 py-3 text-slate-600 dark:text-slate-300">
            <CellTooltip
              label={<span className="block truncate">{i.location}</span>}
              content={
                <span className="block">
                  <span className="font-medium text-white">{i.location}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">Physical storage location</span>
                </span>
              }
              width={220}
            />
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(i.dateReceived)}
          </td>
        </tr>
      ))}
    </>
  );
}

export function ReceivedItemsTable({
  items,
  total,
  page,
  totalPages,
  pageSize,
  query,
  filter,
}: {
  items: ReceivedRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  query: string;
  filter: { type: string; category: string; q: string; po: string; location: string; from: string; to: string };
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilter = Boolean(filter.type || filter.category || filter.q || filter.po || filter.location || filter.from || filter.to);

  return (
    <div className="-mx-6 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Received Items</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {total.toLocaleString()} Items Available
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              filterOpen || hasFilter
                ? "border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
            {hasFilter && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563eb] px-1 text-[10px] font-bold text-white">
                {[
                  Boolean(filter.type),
                  Boolean(filter.category),
                  Boolean(filter.q),
                  Boolean(filter.po),
                  Boolean(filter.location),
                  Boolean(filter.from || filter.to),
                ].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasFilter && (
            <a
              href="/reports/received"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 transition group-hover:rotate-90" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </a>
          )}
          <ExportExcelButton statuses={["AVAILABLE"]} filter={filter} count={total} />
        </div>
      </div>

      {/* ── Table (internal scroll, sticky header) — flex-1 so it fills the
           remaining card height; body page never scrolls ── */}
      <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/90">
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.type || filter.q ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Serial Number</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.type ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Type</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.q ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Brand</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.q ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Model</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.category ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Category</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.po ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>PO Number</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.location ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Location</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.from || filter.to ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Received</th>
            </tr>
            <TableFilterRow
              basePath="/reports/received"
              initial={{ type: filter.type, category: filter.category, q: filter.q, po: filter.po, location: filter.location, from: filter.from, to: filter.to }}
              show={filterOpen}
            />
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No received items match your filters.</p>
                    <a href="/reports/received" className="text-xs font-medium text-[#2563eb] hover:underline">
                      Clear all filters
                    </a>
                  </div>
                </td>
              </tr>
            ) : (
              groupByDay(items).map((g) => <GroupRows key={g.key} group={g} />)
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="rounded-b-2xl border-t border-slate-100 dark:border-slate-800">
        <ReportsPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} query={query} basePath="/reports/received" />
      </div>
    </div>
  );
}
