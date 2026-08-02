import type { ReactElement } from "react";

/* ──────────────────────────────────────────
   ReportStatStrip — summary stat cards (blue-600 theme)
   ────────────────────────────────────────── */

export function ReportStatStrip({ stats }: { stats: { label: string; value: number; tile: string; icon: ReactElement }[] }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.tile}`}>{s.icon}</span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{s.label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
