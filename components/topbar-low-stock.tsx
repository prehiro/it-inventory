"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type LowStockItem = {
  brand: string;
  model: string;
  available: number;
};

export function TopbarLowStock() {
  const router = useRouter();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/low-stock")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    // stop shake after 8 seconds
    const t = setTimeout(() => setShake(false), 8000);
    return () => clearTimeout(t);
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
        className={`group relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 ${shake ? "animate-warning-shake" : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-rose-400" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4m0 4h.01" />
        </svg>
        <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
          {items.length}
        </div>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 animate-slide-up-flip overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-800">
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent px-4 py-3">
            <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-rose-400" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4m0 4h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Low Stock Alert</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {items.length} item{items.length > 1 ? "s" : ""} running low
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700/50">
            {items.map((item) => (
              <div
                key={item.model}
                className="flex items-center justify-between gap-2 px-4 py-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                    {item.available}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {item.brand} <span className="text-slate-400 dark:text-slate-500">{item.model}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    router.push("/receive");
                  }}
                  className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
