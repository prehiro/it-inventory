"use client";

import { useState } from "react";
import { ReceiveForm } from "./receive-form";
import { BatchReceiveForm } from "./batch-receive-form";

const TABS = [
  { id: "single", label: "Single Input", icon: "cube" },
  { id: "batch", label: "Batch Input", icon: "bolt" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type TabIcon = (typeof TABS)[number]["icon"];

export function ReceiveTabs({
  models,
}: {
  models: { id: string; type: string; model: string; brand: string; category: string }[];
}) {
  const [tab, setTab] = useState<TabId>("single");
  const activeIdx = TABS.findIndex((t) => t.id === tab);

  return (
    <div>
      <div className="relative mb-7 inline-flex w-full max-w-lg rounded-full bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800/70 dark:ring-slate-700/60">
        {/* sliding pill */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 z-0 w-[calc(50%-0.25rem)] rounded-full bg-indigo-600 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
          style={{ transform: `translateX(${activeIdx * 100}%)` }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              tab === t.id
                ? "text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {t.icon === "cube" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <path d="M12 22V12" />
                  <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              )}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {tab === "single" ? (
        <ReceiveForm models={models} />
      ) : (
        <BatchReceiveForm models={models} />
      )}
    </div>
  );
}
