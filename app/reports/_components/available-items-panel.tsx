"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { DatePicker } from "@/components/date-picker";
import { exportAvailableStockAction } from "@/app/actions/export";

/* ──────────────────────────────────────────
   AvailableItemsPanel — filter bar + stat strip for
   "ready to release" inventory pages (received / released)
   Columns: Serial, Type, Brand, Model, Category, PO, Location, Received, Status
   Filter bar: Type (all item types) · Category · Search · From/To · Export
   ────────────────────────────────────────── */

export type AvailableItem = {
  serialNumber: string;
  status: string;
  poNumber: string | null;
  location: string;
  dateReceived: Date;
  model: { type: string; brand: string; model: string; category: string };
};

const CATEGORIES = ["All", "FA", "NCA", "GENERAL"];
const TYPE_OPTIONS = [
  "All",
  "PC",
  "Laptop",
  "Tablet",
  "Mouse",
  "Keyboard",
  "Monitor",
  "Projector",
  "Camera",
  "CCTV",
  "Printer",
  "Kensington",
  "Adaptor",
];

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 ${
          open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <span className={value === "All" ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}>
          {value}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-slate-400" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1.5 max-h-60 w-full overflow-y-auto animate-slide-up-flip rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                value === o
                  ? "bg-blue-600 font-semibold text-white"
                  : "text-slate-700 hover:bg-blue-50 hover:font-semibold hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AvailableItemsPanel({
  basePath,
  initial,
  total,
  stats,
  statuses = ["AVAILABLE"],
  sheetTitle = "Available Stock",
  filename = "it-inventory-available-stock.xlsx",
  showStats = true,
}: {
  basePath: string;
  initial: { type: string; category: string; q: string; from: string; to: string; page: number };
  total: number;
  stats: { label: string; value: number; tile: string; icon: React.ReactNode; color?: string }[];
  statuses?: string[];
  sheetTitle?: string;
  filename?: string;
  showStats?: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type || "All");
  const [category, setCategory] = useState(initial.category || "All");
  const [q, setQ] = useState(initial.q);
  const [debouncedQ, setDebouncedQ] = useState(initial.q);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [busy, setBusy] = useState<"" | "xlsx">("");
  const firstRun = useRef(true);

  // Debounce the search input — avoids a router push per keystroke (flicker/race)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  function push(next: Partial<typeof initial>) {
    const p = new URLSearchParams();
    const merged = { ...{ type, category, q: debouncedQ, from, to }, ...next };
    if (merged.type && merged.type !== "All") p.set("type", merged.type);
    if (merged.category && merged.category !== "All") p.set("category", merged.category);
    if (merged.q) p.set("q", merged.q);
    if (merged.from) p.set("from", merged.from);
    if (merged.to) p.set("to", merged.to);
    p.set("page", "1");
    router.push(`${basePath}?${p.toString()}`);
  }

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    push({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category, debouncedQ, from, to]);

  const activeCount =
    (type !== "All" ? 1 : 0) + (category !== "All" ? 1 : 0) + (q ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0);

  function clearAll() {
    setType("All");
    setCategory("All");
    setQ("");
    setFrom("");
    setTo("");
  }

  async function download() {
    setBusy("xlsx");
    const res = await exportAvailableStockAction({
      statuses,
      type: type === "All" ? "" : type,
      category: category === "All" ? "" : category,
      q,
      from,
      to,
      sheetTitle: sheetTitle,
      subtitle: `Available & ready-to-release inventory${total ? `  ·  ${total.toLocaleString()} items` : ""}`,
      filename: filename,
      chips: stats.map((s) => ({ label: s.label, value: s.value, color: s.color ?? "blue" })),
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
    <>
      {showStats && (
        /* Stat strip */
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.tile}`}>{s.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="w-40">
          <FilterSelect label="Type" value={type} onChange={setType} options={TYPE_OPTIONS} />
        </div>
        <div className="w-40">
          <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
        </div>
        <div className="w-56">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Serial / Model / Brand…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
          <DatePicker value={from} onChange={setFrom} placeholder="Start date" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
          <DatePicker value={to} onChange={setTo} placeholder="End date" />
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            title="Clear all filters"
            className="flex h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex h-[38px] items-center rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {total.toLocaleString()} ready
          </span>
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

            {/* Hover tooltip — spring bounce pop */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2.5 -translate-x-1/2">
              <div
                className="relative origin-bottom translate-y-1.5 scale-90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
                style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                <div className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xl ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5 text-emerald-400" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {busy === "xlsx" ? "Exporting…" : "Export to Excel"}
                </div>
                <div className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-slate-900 ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}