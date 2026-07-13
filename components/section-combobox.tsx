"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export const SECTIONS = [
  "Admin",
  "Manager",
  "QC",
  "QE",
  "PE",
  "Maintenance",
  "Iron Die",
  "Bending Die",
  "Store",
  "Sparepart",
  "Shift Leader",
  "Prd. Office",
  "Anode Trimming",
  "Stacking",
  "Welding",
  "Molding",
  "Anode Separation/Cut",
  "Forming",
  "Aging",
  "Post Cure",
  "Blasting",
  "Final Inspection",
  "Air Tightness",
  "Saleable",
  "Visual Inspection",
  "Packing",
] as const;

export function SectionCombobox({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS as readonly string[];
    return (SECTIONS as readonly string[]).filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  function select(s: string) {
    onChange(s);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        {value || <span className="text-slate-400">Select section…</span>}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[active]) select(filtered[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Search section…"
            className="w-full border-b border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <ul className="max-h-56 overflow-y-auto py-1 text-sm">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-slate-400">No match</li>
            ) : (
              filtered.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(s)}
                    className={`w-full px-3 py-2 text-left ${
                      i === active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
