"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

type GidRecord = {
  employeeNo: string;
  name: string;
  globalId: string;
  email: string;
};

export default function EmployeeNoListPage() {
  return (
    <div>
      <PageHeader
        title="Employee No List"
        subtitle="HR employee reference data"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" className="animate-emp-check" />
          </svg>
        }
      />
      <UploadSection />
      <ListSection />
    </div>
  );
}

function UploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; inserted: number; updated: number; error?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/gid-list/upload", { method: "POST", body: fd });
      const json = await res.json();
      setResult(json);
      if (json.ok && inputRef.current) inputRef.current.value = "";
    } catch {
      setResult({ ok: false, inserted: 0, updated: 0, error: "Upload failed" });
    } finally {
      setBusy(false);
      setFile(null);
    }
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white shadow-md ring-1 ring-slate-200 dark:from-slate-900 dark:to-slate-900/80 dark:ring-slate-800">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Upload XLSX File</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Upsert existing, insert new — just upload the latest HR export</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="mb-4 flex flex-wrap gap-3">
          {[
            { code: "Global ID (A)", desc: "Employee's Global ID" },
            { code: "Alphabet Name (C)", desc: "Full name" },
            { code: "E-mail Address (E)", desc: "Work email" },
            { code: "Employee No (H)", desc: "Primary key" },
          ].map((col) => (
            <span key={col.code} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs dark:bg-slate-800">
              <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{col.code}</span>
              <span className="text-slate-500 dark:text-slate-400">{col.desc}</span>
            </span>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-500/10 dark:file:text-indigo-300 dark:hover:file:bg-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={!file || busy}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload
              </>
            )}
          </button>
        </form>
        {result && (
          <div className={`mt-4 rounded-xl px-5 py-3 text-sm ${
            result.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400"
          }`}>
            <div className="flex items-center gap-2.5">
              {result.ok ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5 shrink-0" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5 shrink-0" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              <span className="font-medium">
                {result.ok
                  ? `${result.inserted} new, ${result.updated} updated`
                  : result.error}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ListSection() {
  const [records, setRecords] = useState<GidRecord[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setBusy(true);
    fetch("/api/gid-list")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setRecords(d.records); })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, []);

  const filtered = search.trim()
    ? records.filter(
        (r) =>
          r.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.globalId.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Employee Records
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">{records.length}</span>
            </h3>
          </div>
        </div>
        <div className="relative w-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-[#2563eb] focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {busy ? (
          <div className="flex items-center justify-center py-16">
            <svg className="h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
            </svg>
            <p className="text-sm text-slate-400">{search ? "No matching records found." : "No records yet. Upload an XLSX file above."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Employee No</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Global ID</th>
                <th className="px-6 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.employeeNo} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="whitespace-nowrap px-6 py-3.5 font-mono text-sm font-medium text-slate-800 dark:text-slate-200">{r.employeeNo}</td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-slate-700 dark:text-slate-300">{r.name}</td>
                  <td className="whitespace-nowrap px-6 py-3.5 font-mono text-slate-600 dark:text-slate-400">{r.globalId}</td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-slate-600 dark:text-slate-400">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
