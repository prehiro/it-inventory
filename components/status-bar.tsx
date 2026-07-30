"use client";

import { useMemo, useState, useEffect } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  if (sorted.length === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;

  return (
    <div className="space-y-3">
      {/* ── Stacked bar ── */}
      <div className="relative flex h-8 w-full overflow-hidden rounded-full">
        {/* Background shimmer */}
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_forwards] rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ animationDelay: "0.1s" }}
        />

        {sorted.map((d, i) => {
          const pct = (d.value / total) * 100;
          const isActive = hovered === null || hovered === d.name;
          return (
            <div
              key={d.name}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
              className="relative h-full"
              style={{
                width: mounted ? `${pct}%` : "0%",
                minWidth: d.value > 0 ? 4 : 0,
                backgroundColor: d.color,
                opacity: isActive ? 1 : 0.25,
                transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + i * 0.1}s, opacity 0.25s`,
              }}
            >
              {/* Thin white highlight at top only */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Legend rows ── */}
      <div className="space-y-1">
        {sorted.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          const barPct = total > 0 ? (d.value / total) * 100 : 0;
          const isActive = hovered === null || hovered === d.name;

          return (
            <div
              key={d.name}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5"
              style={{
                opacity: mounted ? (isActive ? 1 : 0.25) : 0,
                transform: mounted
                  ? "translateX(0)"
                  : "translateX(-12px)",
                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.4 + i * 0.08}s`,
                background:
                  hovered === d.name
                    ? `${d.color}0d`
                    : "transparent",
              }}
            >
              {/* Color dot */}
              <span
                className="relative h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              >
                {mounted && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full"
                    style={{
                      background: d.color,
                      animation: `scale-in 0.4s ease ${0.5 + i * 0.1}s both`,
                    }}
                  />
                )}
              </span>

              {/* Name */}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                {d.name}
              </span>

              {/* Mini bar */}
              <div className="hidden h-2 w-16 overflow-hidden rounded-full bg-slate-100 sm:block dark:bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: mounted
                      ? `${Math.max(2, barPct)}%`
                      : "0%",
                    backgroundColor: d.color,
                    transition: `width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.5 + i * 0.1}s`,
                  }}
                />
              </div>

              {/* Value */}
              <span className="w-10 text-right text-sm font-bold text-slate-900 dark:text-slate-100">
                {mounted ? d.value : 0}
              </span>

              {/* Percent */}
              <span className="w-12 text-right text-xs font-medium text-slate-400 dark:text-slate-500">
                {mounted ? `(${Math.round(pct)}%)` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
