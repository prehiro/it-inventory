"use client";

import { useState } from "react";
import { ExportExcelButton } from "./export-excel-button";
import { TableFilterRow } from "./table-filter-row";
import { ReportsPagination } from "./reports-pagination";
import { CategoryBadge } from "./category-badge";
import { BigGooseTooltip } from "./big-goose-tooltip";
import { StatusBadge } from "@/components/status-badge";

/* ──────────────────────────────────────────
   ReturnedItemsTable — items returned by users (RETURN transactions).
   Layout mirrors ReleasedItemsTable (sticky thead + per-column filter row +
   grouped body + pagination) with 9 columns. The "Returned" column shows
   the RETURN txn date. Returning PIC = returningPicName on the txn.
   ────────────────────────────────────────── */

export type ReturnedRow = {
  serialNumber: string;
  poNumber: string | null;
  location: string;
  dateReceived: Date;
  hostname: string;
  model: { type: string; brand: string; model: string; category: string };
  transactions: {
    id: string;
    date: Date;
    statusAfter: string;
    returningPicName: string | null;
    returnReason: string | null;
    remarks: string | null;
  }[];
};

const TYPE_BADGE = (cat: string) =>
  cat === "FA"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400"
    : cat === "NCA"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/15 dark:text-purple-400";

function groupByDay(items: ReturnedRow[]) {
  const groups: { key: string; date: Date; items: ReturnedRow[] }[] = [];
  for (const i of items) {
    const retDate = i.transactions[0]?.date ?? i.dateReceived;
    const d = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(i);
    else groups.push({ key, date: d, items: [i] });
  }
  return groups;
}

function GroupRows({ group }: { group: { key: string; date: Date; items: ReturnedRow[] } }) {
  const dayFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const today = new Date();
  const isToday =
    group.date.getFullYear() === today.getFullYear() &&
    group.date.getMonth() === today.getMonth() &&
    group.date.getDate() === today.getDate();
  return (
    <>
      <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/40">
        <td colSpan={9} className="px-4 py-2.5">
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
      {group.items.map((i, idx) => {
        const ret = i.transactions[0];
        // Parse "EMP — NAME" (returningPicName) into empNo + name for the
        // two-line cell, mirroring the Assignee cell in the Released report.
        const rawPic = ret?.returningPicName ?? "";
        const picMatch = rawPic.match(/^([^\s—–-]+)\s*[—–-]?\s*(.*)$/);
        const picEmpNo = picMatch && picMatch[1] ? picMatch[1] : "";
        const picName = picMatch && picMatch[2] ? picMatch[2] : rawPic || "—";
        return (
          <tr
            key={`${i.serialNumber}-${ret?.id ?? idx}`}
            className={`border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/40 ${
              idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-800/20"
            }`}
          >
            <td className="max-w-0 px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">
              <BigGooseTooltip
                label={<span className="block truncate">{i.serialNumber}</span>}
                tooltip={
                  <span className="block font-mono text-[11px] tracking-wide">
                    {i.serialNumber}
                  </span>
                }
                category={i.model.category}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_BADGE(i.model.category)}`}
              >
                {i.model.type}
              </span>
            </td>
            <td className="max-w-0 px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
              <BigGooseTooltip
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">{i.model.brand}</span>
                    <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">{i.model.model}</span>
                  </div>
                }
                tooltip={
                  <span className="block">
                    <span className="block font-medium text-white">{i.model.brand}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-300">{i.model.model}</span>
                  </span>
                }
                category={i.model.category}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <CategoryBadge category={i.model.category} />
            </td>
            <td className="max-w-0 px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
              <BigGooseTooltip
                label={<span className="block truncate">{i.poNumber || "—"}</span>}
                tooltip={i.poNumber || "No PO"}
                category={i.model.category}
              />
            </td>
            <td className="max-w-0 px-4 py-3 text-slate-700 dark:text-slate-200">
              <BigGooseTooltip
                label={
                  <div className="flex flex-col">
                    <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                      {picName}
                    </span>
                    <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                      {picEmpNo}
                    </span>
                  </div>
                }
                tooltip={
                  <span className="block leading-relaxed">
                    <span className="block text-[11px] font-medium text-white">{picName}</span>
                    {picEmpNo ? (
                      <span className="mt-0.5 block text-[11px] text-slate-300">{picEmpNo}</span>
                    ) : null}
                    {ret?.remarks ? (
                      <span className="mt-1.5 block border-t border-slate-700/60 pt-1.5 text-[11px] text-slate-300">{ret.remarks}</span>
                    ) : null}
                  </span>
                }
                category={i.model.category}
              />
            </td>
            <td className="max-w-0 px-4 py-3">
              <StatusBadge status={ret?.statusAfter ?? "RETURNED_KEEP"} />
            </td>
            <td className="max-w-0 px-4 py-3 text-slate-600 dark:text-slate-300">
              <BigGooseTooltip
                label={<span className="block truncate">{ret?.returnReason || "—"}</span>}
                tooltip={ret?.returnReason || "No reason"}
                category={i.model.category}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
              {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(ret?.date ?? i.dateReceived)}
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function ReturnedItemsTable({
  items,
  total,
  page,
  totalPages,
  pageSize,
  query,
  filter,
}: {
  items: ReturnedRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  query: string;
  filter: { type: string; category: string; q: string; serial: string; brand: string; model: string; po: string; from: string; to: string; assignee?: string; status?: string; reason?: string; brandModel?: string };
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilter = Boolean(filter.type || filter.category || filter.q || filter.serial || filter.brand || filter.model || filter.po || filter.from || filter.to || filter.assignee || filter.status || filter.reason || filter.brandModel);

  return (
    <div className="-mx-6 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14l-4-4 4-4" />
              <path d="M5 10h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Returned Items</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {total.toLocaleString()} Items Returned
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
                  Boolean(filter.serial),
                  Boolean(filter.brand),
                  Boolean(filter.model),
                  Boolean(filter.brandModel),
                  Boolean(filter.po),
                  Boolean(filter.from || filter.to),
                  Boolean(filter.assignee),
                  Boolean(filter.status),
                  Boolean(filter.reason),
                ].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasFilter && (
            <a
              href="/reports/returned"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 transition group-hover:rotate-90" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </a>
          )}
          <ExportExcelButton
            statuses={["RETURNED"]}
            filter={{ type: filter.type, category: filter.category, q: filter.q, po: filter.po, from: filter.from, to: filter.to, assignee: filter.assignee ?? "", status: filter.status ?? "", reason: filter.reason ?? "", brandModel: filter.brandModel ?? "" }}
            count={total}
            sheetTitle="Returned Item"
            filename="it-inventory-returned-item.xlsx"
            subtitle="Items returned by users"
          />
        </div>
      </div>

      {/* ── Table (internal scroll, sticky header) — flex-1 fills remaining card height ── */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[8%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/90">
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.type || filter.q || filter.serial ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Serial Number</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.type ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Type</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.q || filter.brand || filter.model || filter.brandModel ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Brand / Model</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.category ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Category</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.po ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>PO Number</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.assignee ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Returning PIC</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.status ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Status</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.q ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Return Reason</th>
              <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${filter.from || filter.to ? "text-[#2563eb]" : "text-slate-500 dark:text-slate-400"}`}>Returned</th>
            </tr>
            <TableFilterRow
              basePath="/reports/returned"
              initial={{ type: filter.type, category: filter.category, q: filter.q, serial: filter.serial, brand: filter.brand, model: filter.model, po: filter.po, location: "", from: filter.from, to: filter.to, assignee: filter.assignee ?? "", status: filter.status ?? "", reason: filter.reason ?? "", brandModel: filter.brandModel ?? "" }}
              show={filterOpen}
              withAssignee
              withStatus
              withReason
              statusFirst
              statusOptions={["All", "RETURNED_KEEP", "IN_REPAIR", "PLAN_DISPOSE"]}
              withLocation={false}
              brandModelSingle
            />
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 14l-4-4 4-4" />
                      <path d="M5 10h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No returned items match your filters.</p>
                    <a href="/reports/returned" className="text-xs font-medium text-[#2563eb] hover:underline">
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
        <ReportsPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} query={query} basePath="/reports/returned" />
      </div>
    </div>
  );
}
