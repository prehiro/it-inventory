"use client";

import { useState, useRef, useEffect } from "react";

type LowStockItem = {
  brand: string;
  model: string;
  available: number;
};

export function TopbarLowStock() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/low-stock")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Low stock items"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-50 dark:hover:bg-amber-500/10 icon-shake"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4m0 4h.01" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="low-stock-popover absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-amber-700 dark:bg-slate-900">
          <div className="border-b border-amber-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:border-amber-800 dark:text-amber-400">
            Low Stock Items
          </div>
          <div className="max-h-52 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.model}
                className="flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-500/5"
              >
                <span className="truncate text-slate-700 dark:text-slate-300">
                  {item.brand} {item.model}
                </span>
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  {item.available}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
