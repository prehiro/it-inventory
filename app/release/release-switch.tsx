"use client";

import { useState } from "react";
import { ReleaseForm } from "./release-form";
import { BatchReleaseForm } from "./batch-release-form";

export function ReleaseSwitch() {
  const [batchMode, setBatchMode] = useState(false);

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode</span>
        <div className="relative flex rounded-full bg-slate-100 p-0.5 text-sm dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setBatchMode(false)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              !batchMode ? "text-white" : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
            Single
          </button>
          <button
            type="button"
            onClick={() => setBatchMode(true)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              batchMode ? "text-white" : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Batch
          </button>
          {/* sliding pill */}
          <div
            className={`absolute top-0.5 h-[calc(100%-4px)] rounded-full bg-indigo-600 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              batchMode ? "left-1/2 w-1/2" : "left-0.5 w-1/2"
            }`}
          />
        </div>
      </div>
      {batchMode ? <BatchReleaseForm /> : <ReleaseForm />}
    </>
  );
}
