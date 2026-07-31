"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { auditView, TONE_CLASS } from "@/lib/audit-format";
import type { AuditView } from "@/lib/audit-format";

type LogEntry = {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
  serialNumber?: string;
  assignee?: string;
  model?: string;
  disposition?: string;
  poNumber?: string;
  dept?: string;
  reason?: string;
  raw?: Record<string, unknown>;
};

type ActionMeta = { action: string; count: number };

function parseDetails(details: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(details);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

/** Deterministic status flow per action — the "story" of the item. */
function statusFlow(action: string): string[] | null {
  switch (action) {
    case "RECEIVED_ITEM":
      return ["AVAILABLE"];
    case "RELEASED_ITEM":
      return ["AVAILABLE", "RELEASED"];
    case "RETURNED_ITEM":
      return ["RELEASED", "RETURNED"];
    case "CREATED_MODEL":
      return ["MODEL CREATED"];
    case "DELETED_MODEL":
      return ["MODEL DELETED"];
    case "CREATED_USER":
      return ["USER CREATED"];
    case "DELETED_USER":
      return ["USER DELETED"];
    case "UPDATED_USER_ROLE":
      return ["ROLE CHANGED"];
    default:
      return null;
  }
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actions, setActions] = useState<ActionMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filterAction) params.set("action", filterAction);
      if (search.trim()) params.set("q", search.trim());
      const sp = new URLSearchParams(window.location.search);
      const f = sp.get("from");
      const t = sp.get("to");
      if (f && t) {
        params.set("from", f);
        params.set("to", t);
        if (!dateFilter) setDateFilter({ from: f, to: t });
      }
      const res = await fetch(`/api/audit-logs?${params}`);
      const json = await res.json();
      if (json.ok) {
        const enriched = json.logs.map((l: LogEntry) => {
          const parsed = parseDetails(l.details);
          return {
            ...l,
            serialNumber: parsed.serialNumber as string | undefined,
            assignee: (parsed.assignee ?? parsed.pic) as string | undefined,
            model: parsed.model as string | undefined,
            disposition: (parsed.disposition ?? parsed.reason) as string | undefined,
            poNumber: parsed.poNumber as string | undefined,
            dept: parsed.assigneeDept as string | undefined,
            reason: parsed.reason as string | undefined,
            raw: parsed,
          };
        });
        setLogs(enriched);
        setTotalPages(json.totalPages);
        setTotal(json.total);
        setAllTotal(json.allTotal ?? json.total);
        if (json.actions) setActions(json.actions);
      }
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  }, [page, filterAction, search, dateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [filterAction, search]);

  const groupedLogs = useMemo(() => {
    const groups: { label: string; items: LogEntry[] }[] = [];
    for (const log of logs) {
      const d = new Date(log.timestamp);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayDiff = Math.round((startOfToday - startOfDay) / 86400000);
      let label: string;
      if (dayDiff === 0) label = "Today";
      else if (dayDiff === 1) label = "Yesterday";
      else label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(log);
      else groups.push({ label, items: [log] });
    }
    return groups;
  }, [logs]);

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle={`${total} events recorded`}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 animate-shield" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
        action={
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search details or user…"
              className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-[#066fd1] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        }
      />

      {dateFilter && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm dark:bg-indigo-500/10">
          <span className="text-indigo-600 dark:text-indigo-400">
            Showing activity from {dateFilter.from} to {dateFilter.to}
          </span>
          <button
            onClick={() => {
              setDateFilter(null);
              window.history.replaceState({}, "", "/admin/audit-trail");
            }}
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter pills — single-select */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterAction("")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
            !filterAction
              ? "border-[#066fd1] bg-[#066fd1] text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          All
          <span className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${!filterAction ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"}`}>
            {allTotal}
          </span>
        </button>
        {actions.map((a) => {
          const v = auditView(a.action, "{}");
          const Icon = v.icon;
          const active = filterAction === a.action;
          return (
            <button
              key={a.action}
              onClick={() => setFilterAction(active ? "" : a.action)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-[#066fd1] bg-[#066fd1] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "" : TONE_CLASS[v.tone].replace("bg-", "text-")}`} />
              {v.label}
              <span className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"}`}>
                {a.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {busy ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm text-slate-400 dark:text-slate-500">No matching events found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupedLogs.map((group) => (
              <li key={group.label}>
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-500">
                  {group.label}
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((log) => {
                    const v: AuditView = auditView(log.action, log.details);
                    const Icon = v.icon;
                    const date = new Date(log.timestamp);
                    const timeAgo = formatTimeAgo(date);
                    const flow = statusFlow(log.action);
                    const isOpen = expandedId === log.id;
                    return (
                      <li key={log.id}>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : log.id)}
                          className="group flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          {/* Icon container */}
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${TONE_CLASS[v.tone]} bg-opacity-10`}>
                            <Icon className={`h-6 w-6 ${TONE_CLASS[v.tone].replace("bg-", "text-")}`} />
                          </span>
                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
                                {v.label}
                              </span>
                              {flow && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                                  {flow.map((s, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5">
                                      {i > 0 && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3 text-indigo-500 dark:text-indigo-400" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="5" y1="12" x2="19" y2="12" />
                                          <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                      )}
                                      <span className={i === flow.length - 1 ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}>
                                        {s}
                                      </span>
                                    </span>
                                  ))}
                                </span>
                              )}
                              {log.serialNumber && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                  {log.serialNumber}
                                </span>
                              )}
                              {log.model && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                  {log.model}
                                </span>
                              )}
                              {log.assignee && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700">
                                  {log.assignee}
                                </span>
                              )}
                              {log.disposition && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700">
                                  {log.disposition}
                                </span>
                              )}
                              {v.summary && v.summary !== "—" && (
                                <span className="truncate text-sm text-slate-600 dark:text-slate-300">{cleanSummary(v.summary, log.serialNumber, log.assignee)}</span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                              <span className="font-medium text-slate-500 dark:text-slate-400">{log.user}</span>
                              <span>·</span>
                              <time dateTime={log.timestamp} title={date.toLocaleString()} className="text-slate-500 dark:text-slate-400">
                                {timeAgo}
                              </time>
                            </div>
                          </div>
                          {/* Timestamp on hover */}
                          <span className="hidden shrink-0 items-center gap-1 text-xs text-slate-400 group-hover:flex dark:text-slate-500">
                            {date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </button>
                        {isOpen && log.raw && (
                          <div className="animate-panel-in border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                              {Object.entries(log.raw).map(([k, val]) => (
                                <div key={k} className="min-w-0">
                                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{k}</dt>
                                  <dd className="truncate text-sm text-slate-700 dark:text-slate-200" title={String(val)}>
                                    {String(val ?? "—")}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Remove the serial number and PIC from the summary so it doesn't repeat next to the SN badge. */
function cleanSummary(summary: string, serialNumber?: string, pic?: string): string {
  if (!serialNumber && !pic) return summary;
  // Summary formats like "SN123 → John" or "SN123 by John" or "SN123"
  let cleaned = summary;
  if (serialNumber) {
    const idx = cleaned.indexOf(serialNumber);
    if (idx !== -1) {
      cleaned = cleaned.slice(idx + serialNumber.length);
      cleaned = cleaned.replace(/^\s*(→|by|,)\s*/, "") || "—";
    }
  }
  if (pic) {
    // Remove PIC if it's the same as assignee or appears in the summary
    cleaned = cleaned.replace(new RegExp(`\\b${pic}\\b`, "g"), "").trim();
  }
  return cleaned || "—";
}