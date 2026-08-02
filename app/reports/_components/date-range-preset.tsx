"use client";

import { useState, useRef, useEffect } from "react";
import { DatePicker } from "@/components/date-picker";
import { usePopoverPosition } from "@/components/popover";

/* ──────────────────────────────────────────
   DateRangePreset — compact date-range filter for narrow columns.
   One button ("Semua tanggal") → popover with quick presets
   (Today / 7d / 30d / This month / Last month) + custom From–To.
   Keeps the column narrow: zero layout shift.
   ────────────────────────────────────────── */

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

const PRESETS = [
  {
    key: "today",
    label: "Hari ini",
    calc: () => {
      const t = new Date();
      return { from: toISODate(t), to: toISODate(t) };
    },
  },
  {
    key: "7d",
    label: "7 hari terakhir",
    calc: () => {
      const t = new Date();
      const f = new Date(t);
      f.setDate(f.getDate() - 6);
      return { from: toISODate(f), to: toISODate(t) };
    },
  },
  {
    key: "30d",
    label: "30 hari terakhir",
    calc: () => {
      const t = new Date();
      const f = new Date(t);
      f.setDate(f.getDate() - 29);
      return { from: toISODate(f), to: toISODate(t) };
    },
  },
  {
    key: "month",
    label: "Bulan ini",
    calc: () => {
      const t = new Date();
      const from = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to: toISODate(t) };
    },
  },
  {
    key: "lastmonth",
    label: "Bulan lalu",
    calc: () => {
      const t = new Date();
      const f = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const l = new Date(t.getFullYear(), t.getMonth(), 0);
      return { from: toISODate(f), to: toISODate(l) };
    },
  },
];

export function DateRangePreset({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { portal } = usePopoverPosition({
    open,
    triggerRef: btnRef,
    width: 320,
    align: "right",
    gap: 6,
  });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest?.("[data-date-popover]")
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = Boolean(from || to);
  const label = active
    ? from && to
      ? `${fmtShort(from)} – ${fmtShort(to)}`
      : from
        ? `Sejak ${fmtShort(from)}`
        : `Sampai ${fmtShort(to)}`
    : "Semua tanggal";

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-1 rounded border bg-white px-2 py-1 text-xs outline-none transition focus:border-[#2563eb] dark:bg-slate-800 ${
          active || open
            ? "border-[#2563eb] text-slate-700 dark:text-slate-200"
            : "border-slate-200 text-slate-400 dark:border-slate-600 dark:text-slate-500"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-3.5 w-3.5 shrink-0"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="flex-1 truncate text-left">{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-3 w-3 shrink-0"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {portal(
        <div data-date-popover className="w-80 rounded-xl bg-white p-3 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {/* Quick presets */}
          <div className="grid grid-cols-2 gap-1">
            {PRESETS.map((p) => {
              const r = p.calc();
              const isActive = from === r.from && to === r.to;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    onChange(r.from, r.to);
                    setOpen(false);
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                    isActive
                      ? "bg-[#2563eb] font-semibold text-white"
                      : "text-slate-600 hover:bg-blue-50 hover:font-semibold hover:text-[#2563eb] dark:text-slate-300 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom From–To */}
          <div className="mt-2.5 border-t border-slate-100 pt-2.5 dark:border-slate-700">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Custom
            </p>
            <div className="flex items-center gap-1.5">
              <DatePicker
                value={from}
                onChange={(v) => onChange(v, to)}
                placeholder="Dari"
                compact
              />
              <span className="shrink-0 text-slate-300 dark:text-slate-600">–</span>
              <DatePicker
                value={to}
                onChange={(v) => onChange(from, v)}
                placeholder="Sampai"
                compact
              />
            </div>
          </div>

          {active && (
            <button
              type="button"
              onClick={() => {
                onChange("", "");
                setOpen(false);
              }}
              className="mt-2 w-full rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Hapus filter tanggal
            </button>
          )}
        </div>,
      )}
    </div>
  );
}
