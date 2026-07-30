"use client";

import { useMemo, useState } from "react";

interface BarDatum {
  name: string;
  value: number;
  color: string;
}

export function StatusBar({
  data,
  total,
}: {
  data: BarDatum[];
  total: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  if (sorted.length === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;

  return (
    <div className="space-y-3">
      {/* Stacked bar row */}
      <div className="flex h-8 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {sorted.map((d, i) => {
          const pct = (d.value / total) * 100;
          const isActive = hovered === null || hovered === d.name;
          return (
            <div
              key={d.name}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
              className="relative h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${pct}%`,
                minWidth: d.value > 0 ? 4 : 0,
                backgroundColor: d.color,
                opacity: isActive ? 1 : 0.25,
              }}
            >
              {/* Mini label inside bar if segment is wide enough */}
              {pct > 12 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-sm">
                  {d.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend rows */}
      <div className="space-y-1.5">
        {sorted.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          const barPct = total > 0 ? (d.value / total) * 100 : 0;
          const isActive = hovered === null || hovered === d.name;

          return (
            <div
              key={d.name}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-all"
              style={{
                opacity: isActive ? 1 : 0.25,
                background:
                  hovered === d.name
                    ? `${d.color}0d`
                    : "transparent",
              }}
            >
              {/* Color dot */}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />

              {/* Name */}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                {d.name}
              </span>

              {/* Mini bar */}
              <div className="hidden h-2 w-16 overflow-hidden rounded-full bg-slate-100 sm:block dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(2, barPct)}%`,
                    backgroundColor: d.color,
                  }}
                />
              </div>

              {/* Value */}
              <span className="w-10 text-right text-sm font-bold text-slate-900 dark:text-slate-100">
                {d.value}
              </span>

              {/* Percent */}
              <span className="w-12 text-right text-xs font-medium text-slate-400 dark:text-slate-500">
                ({Math.round(pct)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
