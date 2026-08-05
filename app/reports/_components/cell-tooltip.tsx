"use client";

import { useRef, useState } from "react";
import { usePopoverPosition } from "@/components/popover";

/* ──────────────────────────────────────────
   CellTooltip — hover popup for truncated table cells.
   Same visual language as the Export Excel button tooltip:
   dark slate bubble, spring-bounce entrance, small arrow,
   rendered via portal so it's never clipped by the table's
   overflow container. Width/align are adjustable per cell.
   ────────────────────────────────────────── */

export function CellTooltip({
  label,
  content,
  width = 260,
  align = "left",
}: {
  label: React.ReactNode;
  content: React.ReactNode;
  width?: number | "auto";
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { popRef, flipped, portal } = usePopoverPosition({
    open,
    triggerRef,
    width,
    align,
    gap: 8,
  });

  // Arrow points up when the popover sits BELOW the trigger (common case),
  // points down when usePopoverPosition flipped it above the trigger.
  const isBelow = !flipped;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="block min-w-0 w-full cursor-default overflow-hidden"
      >
        {label}
      </span>
      {portal(
        <div ref={popRef}>
          <div
            className={`relative origin-top transition-all duration-300 ${
              open ? "translate-y-0 scale-100 opacity-100" : "translate-y-1.5 scale-90 opacity-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {isBelow ? (
              <div className="absolute left-4 top-0 h-2 w-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-slate-900 ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50" />
            ) : (
              <div className="absolute bottom-0 left-4 h-2 w-2 translate-y-1/2 rotate-45 rounded-[2px] bg-slate-900 ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50" />
            )}
            <div className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs text-white shadow-xl ring-1 ring-slate-700/60 dark:bg-slate-800 dark:ring-slate-600/50">
              {content}
            </div>
          </div>
        </div>,
      )}
    </>
  );
}
