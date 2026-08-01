"use client";

import { useState, useCallback } from "react";
import { ReceiveForm } from "./receive-form";
import { BatchReceiveForm } from "./batch-receive-form";

const TABS = [
  {
    id: "single",
    label: "Single Input",
    desc: "Receive one item at a time",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M12 22V12" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      </svg>
    ),
  },
  {
    id: "batch",
    label: "Batch Input",
    desc: "Import multiple serial numbers at once",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReceiveTabs({
  models,
}: {
  models: { id: string; type: string; model: string; brand: string; category: string }[];
}) {
  const [tab, setTab] = useState<TabId>("single");
  const activeIdx = TABS.findIndex((t) => t.id === tab);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (idx + 1) % TABS.length;
        setTab(TABS[next].id);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (idx - 1 + TABS.length) % TABS.length;
        setTab(TABS[prev].id);
      }
    },
    []
  );

  return (
    <div>
      {/* ── Accessible tab bar ── */}
      <div
        role="tablist"
        aria-label="Receive mode"
        className="relative mb-8 inline-flex w-full max-w-lg rounded-xl bg-slate-100 p-1.5 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/60 dark:ring-slate-700/50"
      >
        {/* Sliding indicator */}
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-1.5 z-0 w-[calc(50%-0.375rem)] rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] dark:bg-slate-800 dark:ring-slate-700"
          style={{ transform: `translateX(${activeIdx * 100}%)` }}
        />

        {TABS.map((t, idx) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800 ${
              tab === t.id
                ? "text-[#2563eb] dark:text-[#2563eb]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        role="tabpanel"
        id="panel-single"
        aria-labelledby="tab-single"
        hidden={tab !== "single"}
        className={tab === "single" ? "animate-fade-in" : "hidden"}
      >
        <ReceiveForm models={models} />
      </div>
      <div
        role="tabpanel"
        id="panel-batch"
        aria-labelledby="tab-batch"
        hidden={tab !== "batch"}
        className={tab === "batch" ? "animate-fade-in" : "hidden"}
      >
        <BatchReceiveForm models={models} />
      </div>
    </div>
  );
}
