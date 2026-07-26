"use client";

import { useState, useRef, useEffect } from "react";

type LowStockItem = {
  brand: string;
  model: string;
  available: number;
};

export function LowStockPopover({ items }: { items: LowStockItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="low-stock-pill group flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-300/30 transition-all duration-300 hover:border-amber-300 hover:bg-amber-100 hover:shadow-amber-200/40 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20 dark:hover:border-amber-600 dark:hover:bg-amber-500/20"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="h-3.5 w-3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4m0 4h.01" />
        </svg>
        <span>Low stock</span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400/20 px-1 text-[10px] font-bold text-amber-600 dark:text-amber-300">
          {items.length}
        </span>
      </button>

      {open && (
        <div className="low-stock-popover absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-amber-700 dark:bg-slate-900">
          <div className="border-b border-amber-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:border-amber-800 dark:text-amber-400">
            Low Stock Items
          </div>
          <div className="max-h-48 overflow-y-auto">
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
