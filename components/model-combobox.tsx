"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Model = { id: string; type: string; model: string; brand: string; category: string };

const CATEGORIES = ["FA", "NCA", "GENERAL"];

export function ModelCombobox({
  models,
  value,
  onChange,
  placeholder = "Select item type / model…",
}: {
  models: Model[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = models.find((m) => m.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.type.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q),
    );
  }, [models, query]);

  // reset highlight when list changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(0);
  }, [query, open]);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(m: Model) {
    onChange(m.id);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = filtered[active];
      if (m) choose(m);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  // group filtered by category, preserving CATEGORIES order
  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      cat,
      items: filtered.filter((m) => m.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  const flatIndex = (catIdx: number, itemIdx: number) =>
    grouped.slice(0, catIdx).reduce((n, g) => n + g.items.length, 0) + itemIdx;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {selected.type} · {selected.brand} {selected.model}
            </span>
            <CatBadge cat={selected.category} />
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full animate-fade-in overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search brand or name…"
            className="w-full border-b border-slate-100 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:text-slate-100"
          />
          <ul className="max-h-64 overflow-y-auto py-1">
            {grouped.length === 0 && (
              <li className="px-3 py-3 text-center text-sm text-slate-400">No models found</li>
            )}
            {grouped.map((g, gi) => (
              <li key={g.cat}>
                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {g.cat}
                </div>
                {g.items.map((m, mi) => {
                  const idx = flatIndex(gi, mi);
                  const isActive = idx === active;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => choose(m)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-500/15"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <span className={value === m.id ? "font-medium text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-100"}>
                        {m.type} · {m.brand} {m.model}
                      </span>
                      <CatBadge cat={m.category} />
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CatBadge({ cat }: { cat: string }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {cat}
    </span>
  );
}
