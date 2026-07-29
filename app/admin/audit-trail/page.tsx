"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { auditView, TONE_CLASS } from "@/lib/audit-format";
import type { AuditView } from "@/lib/audit-format";

type LogEntry = {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
};

type ActionMeta = { action: string; count: number };

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actions, setActions] = useState<ActionMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filterAction) params.set("action", filterAction);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/audit-logs?${params}`);
      const json = await res.json();
      if (json.ok) {
        setLogs(json.logs);
        setTotalPages(json.totalPages);
        setTotal(json.total);
        if (json.actions) setActions(json.actions);
      }
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  }, [page, filterAction, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterAction, search]);

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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            >
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

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterAction("")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            !filterAction
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          All
        </button>
        {actions.map((a) => {
          const v = auditView(a.action, "{}");
          const active = filterAction === a.action;
          return (
            <button
              key={a.action}
              onClick={() => setFilterAction(active ? "" : a.action)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {v.label}
              <span className={`ml-0.5 rounded-full px-1.5 py-0 text-[10px] ${
                active ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}>
                {a.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {busy ? (
          <div className="flex items-center justify-center py-24">
            <svg className="h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm text-slate-400">No matching events found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const v: AuditView = auditView(log.action, log.details);
              const Icon = v.icon;
              const date = new Date(log.timestamp);
              const timeAgo = formatTimeAgo(date);
              return (
                <li key={log.id} className="group flex items-start gap-4 px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {/* Icon */}
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
                        {v.label}
                      </span>
                      {v.summary && v.summary !== "—" && (
                        <span className="truncate text-sm text-slate-600 dark:text-slate-300">{v.summary}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span className="font-medium text-slate-500 dark:text-slate-400">{log.user}</span>
                      <span>·</span>
                      <time dateTime={log.timestamp} title={date.toLocaleString()}>
                        {timeAgo}
                      </time>
                    </div>
                  </div>

                  {/* Timestamp on hover */}
                  <span className="hidden shrink-0 text-xs text-slate-400 group-hover:block dark:text-slate-500">
                    {date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800"
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
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800"
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
