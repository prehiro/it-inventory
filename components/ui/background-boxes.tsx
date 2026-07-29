"use client";

import React, { useMemo } from "react";

/**
 * Background Boxes — lightweight version.
 * Uses CSS-only hover (no React state rerenders).
 * Each cell gets a random color via inline CSS variable at mount.
 */

const COLORS = [
  "125 211 252", // sky-300
  "249 168 212", // pink-300
  "134 239 172", // green-300
  "253 224 71",  // yellow-300
  "252 165 165", // red-300
  "216 180 254", // purple-300
  "147 197 253", // blue-300
  "165 180 252", // indigo-300
];

const ROWS = 70;
const COLS = 50;

const BoxesCore = ({ className = "" }: { className?: string }) => {
  // Pre-compute random colors once at mount — no state, no rerenders
  const cells = useMemo(() => {
    return Array.from({ length: ROWS }, (_, i) =>
      Array.from({ length: COLS }, (_, j) => ({
        key: `${i}-${j}`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        showPlus: i % 3 === 0 && j % 3 === 0,
      }))
    );
  }, []);

  return (
    <div
      style={{
        transform:
          "translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)",
      }}
      className={`absolute -top-1/4 left-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4 ${className}`}
    >
      {cells.map((row, i) => (
        <div key={`r-${i}`} className="relative h-8 w-16 shrink-0 border-l border-slate-700/60">
          {row.map((cell) => (
            <div
              key={cell.key}
              className="box-cell relative h-8 w-16 border-r border-t border-slate-700/60"
              style={{ "--box-color": `rgb(${cell.color})` } as React.CSSProperties}
            >
              {cell.showPlus && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="pointer-events-none absolute -left-[22px] -top-[14px] h-6 w-10 stroke-[1px] text-slate-700/60"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);