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
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
          open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300"
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
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition-colors ${
                    isActive
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
}: {
  initial: { type: string; status: string; from: string; to: string };
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type);
  const [status, setStatus] = useState(initial.status);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<"" | "xlsx" | "pdf">("");

  // Auto-apply filter on any change
  useEffect(() => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", "1"); // reset to page 1 on filter change
    router.push(`/reports?${p.toString()}`);
  }, [type, status, from, to, router]);

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
    const filter = { type, status, from, to };
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
      <div className="w-40">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
        <FilterSelect value={type} onChange={setType} options={typeOptions} placeholder="All types" />
      </div>
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
        <button
          disabled={busy !== ""}
          onClick={() => download()}
          className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-60 disabled:hover:bg-green-700"
        >
          <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" rx="7" fill="#217346" />
            <path d="M20.1 5.5v6.99L13.6 5.5H9.4v5.58l6.49 5.92-6.49 5.92v5.58h4.2l6.5-6.99V26.5h4.2v-21z" fill="#ffffff" />
          </svg>
          {busy === "xlsx" ? "Exporting…" : "Export Excel"}
        </button>
      </div>
    </div>
  );
}
