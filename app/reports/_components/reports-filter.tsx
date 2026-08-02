"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { exportExcelAction } from "@/app/actions/export";
import { DatePicker } from "@/components/date-picker";

/* ──────────────────────────────────────────
   FilterSelect — custom dropdown (blue-600 theme)
   Keyboard: ↑↓ navigate · Enter select · Esc close
   ────────────────────────────────────────── */
function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActive(idx === -1 ? 0 : idx);
    }
  }, [open, options, value]);

  // Scroll active option into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onChange(options[active].value);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
          }`}
      >
        <span className={selected ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-blue-600" : ""}`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full min-w-[180px] animate-slide-up-flip overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        >
          {options.map((o, i) => {
            const isActive = i === active;
            const isSelected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition-colors ${isActive
                      ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      : isSelected
                        ? "font-medium text-blue-600 dark:text-blue-400"
                        : "text-slate-700 hover:bg-blue-50 hover:font-semibold hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
                    }`}
                >
                  <span>{o.label}</span>
                  {isSelected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   ReportsFilter bar
   ────────────────────────────────────────── */
export function ReportsFilter({
  initial,
  basePath = "/reports",
  showType = true,
}: {
  initial: { type: string; status: string; from: string; to: string };
  basePath?: string;
  showType?: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type);
  const [status, setStatus] = useState(initial.status);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<"" | "xlsx">("");
  const firstRun = useRef(true);

  // Auto-apply filter on any change (skip the initial mount — the page
  // already rendered with these params, avoiding a double-navigate flicker)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const p = new URLSearchParams();
    if (showType && type) p.set("type", type);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", "1"); // reset to page 1 on filter change
    router.push(`${basePath}?${p.toString()}`);
  }, [type, status, from, to, router, basePath, showType]);

  // Sync: when type changes, drop a status that's impossible for that type
  const statusOptions = [
    { value: "", label: "All" },
    { value: "AVAILABLE", label: "Available" },
    { value: "RELEASED", label: "Released" },
    { value: "RETURNED_KEEP", label: "Returned" },
    { value: "IN_REPAIR", label: "In Repair" },
    { value: "PLAN_DISPOSE", label: "Plan Dispose" },
  ];

  // Status options valid per transaction type (matches statusAfter in DB)
  const getStatusOptions = (selType: string) => {
    if (selType === "RECEIVE") {
      return statusOptions.filter((o) => o.value === "" || o.value === "AVAILABLE");
    }
    if (selType === "RELEASE") {
      return statusOptions.filter((o) => o.value === "" || o.value === "RELEASED");
    }
    if (selType === "RETURN") {
      return statusOptions.filter((o) => o.value === "" || ["RETURNED_KEEP", "IN_REPAIR", "PLAN_DISPOSE"].includes(o.value));
    }
    return statusOptions;
  };

  // If current status is impossible for the selected type, clear it
  useEffect(() => {
    const valid = getStatusOptions(type).map((o) => o.value);
    if (status && !valid.includes(status)) setStatus("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // If a status is picked that only makes sense without a type, clear type
  useEffect(() => {
    if (!type || !status) return;
    const valid = getStatusOptions(type).map((o) => o.value);
    if (!valid.includes(status)) setType("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function download() {
    setBusy("xlsx");
    const filter = { type: showType ? type : initial.type, status, from, to };
    const res = await exportExcelAction(filter);
    setBusy("");
    if (!res.ok) { alert(res.error); return; }
    const a = document.createElement("a");
    a.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.data}`;
    a.download = res.filename;
    a.click();
  }

  const typeOptions = [
    { value: "", label: "All" },
    { value: "RECEIVE", label: "Received" },
    { value: "RELEASE", label: "Released" },
    { value: "RETURN", label: "Returned" },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      {showType && (
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
          <FilterSelect value={type} onChange={setType} options={typeOptions} placeholder="All types" />
        </div>
      )}
      <div className="w-44">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
        <FilterSelect value={status} onChange={setStatus} options={getStatusOptions(type)} placeholder="All statuses" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
        <DatePicker value={from} onChange={setFrom} placeholder="Start date" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
        <DatePicker value={to} onChange={setTo} placeholder="End date" />
      </div>
      {(type || status || from || to) && (
        <button
          type="button"
          onClick={() => {
            setType("");
            setStatus("");
            setFrom("");
            setTo("");
          }}
          title="Clear all filters"
          className="flex h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
      <div className="ml-auto flex gap-2">
        <div className="group relative">
          <button
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
                {busy === "xlsx" ? "Exporting…" : "Export to Excel"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
