"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePreset } from "./date-range-preset";

/* ──────────────────────────────────────────
   TableFilterRow — column filter row under the table header
   (one field per column, matching the header). Styling mirrors
   PC Ledger's per-column filter row. Server-side filtering via URL.
   ────────────────────────────────────────── */

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

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 ${
          open ? "border-[#2563eb]" : ""
        }`}
      >
        <span className={value === "All" ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}>
          {value === "All" ? placeholder : value}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[9rem] overflow-y-auto rounded-lg bg-white p-1 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${
            align === "right" ? "right-0" : "left-0"
          } max-h-52 w-full`}
        >
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                value === o
                  ? "bg-[#2563eb] font-semibold text-white"
                  : "text-slate-700 hover:bg-blue-50 hover:font-semibold hover:text-[#2563eb] dark:text-slate-200 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
              }`}
            >
              <span>{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";

export function TableFilterRow({
  basePath,
  initial,
  show,
}: {
  basePath: string;
  initial: { type: string; category: string; q: string; po: string; location: string; from: string; to: string };
  show: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type || "All");
  const [category, setCategory] = useState(initial.category || "All");
  const [q, setQ] = useState(initial.q);
  const [debouncedQ, setDebouncedQ] = useState(initial.q);
  const [po, setPo] = useState(initial.po);
  const [debouncedPo, setDebouncedPo] = useState(initial.po);
  const [location, setLocation] = useState(initial.location);
  const [debouncedLocation, setDebouncedLocation] = useState(initial.location);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const firstRun = useRef(true);

  // Debounce text inputs — avoid a router push per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPo(po), 400);
    return () => clearTimeout(t);
  }, [po]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 400);
    return () => clearTimeout(t);
  }, [location]);

  function push() {
    const p = new URLSearchParams();
    if (type !== "All") p.set("type", type);
    if (category !== "All") p.set("category", category);
    if (debouncedQ) p.set("q", debouncedQ);
    if (debouncedPo) p.set("po", debouncedPo);
    if (debouncedLocation) p.set("location", debouncedLocation);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", "1");
    router.push(`${basePath}?${p.toString()}`);
  }

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    push();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category, debouncedQ, debouncedPo, debouncedLocation, from, to]);

  return (
    <tr className={`border-b border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900 ${show ? "" : "hidden"}`}>
      {/* Serial Number */}
      <td className="px-2 py-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {/* Type */}
      <td className="px-2 py-2">
        <Dropdown value={type} onChange={setType} options={TYPE_OPTIONS} placeholder="All" />
      </td>
      {/* Brand */}
      <td className="px-2 py-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {/* Model */}
      <td className="px-2 py-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {/* Category */}
      <td className="px-2 py-2">
        <Dropdown value={category} onChange={setCategory} options={CATEGORIES} placeholder="All" />
      </td>
      {/* PO Number */}
      <td className="px-2 py-2">
        <input value={po} onChange={(e) => setPo(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {/* Location */}
      <td className="px-2 py-2">
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {/* Received */}
      <td className="px-2 py-2">
        <DateRangePreset from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </td>
    </tr>
  );
}
