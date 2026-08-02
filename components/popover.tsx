"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ──────────────────────────────────────────
   usePopoverPosition — portal-based popover positioning.
   Renders popover content in document.body (never clipped by
   overflow/scroll containers) with viewport clamping + auto-flip
   (opens upward when there isn't enough room below the trigger).
   Usage:
     const { pos, popRef, mounted, portal } = usePopoverPosition({ open, triggerRef, width: 320, align: "right" });
     {portal(<div ref={popRef} className="...">...</div>)}
   ────────────────────────────────────────── */

export type PopoverPos = { top: number; left: number } | null;

export function usePopoverPosition({
  open,
  triggerRef,
  width,
  gap = 6,
  align = "left",
  flip = true,
}: {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  width: number | "auto";
  gap?: number;
  align?: "left" | "right";
  flip?: boolean;
}) {
  const [pos, setPos] = useState<PopoverPos>(null);
  const [mounted, setMounted] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  // Mount once (after hydration) so portal has document.body
  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !mounted) return;
    const trig = triggerRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pop = popRef.current;
    const pw = width === "auto" ? (pop ? pop.offsetWidth : r.width) : width;
    const ph = pop ? pop.offsetHeight : 0;

    let top = r.bottom + gap;
    if (flip && r.bottom + gap + ph > vh - 8 && r.top - gap - ph > 8) {
      top = r.top - gap - ph;
    }
    let left = align === "right" ? r.right - pw : r.left;
    left = Math.max(8, Math.min(left, vw - pw - 8));
    setPos({ top, left });
  }, [open, mounted, triggerRef, width, gap, align, flip]);

  function portal(children: React.ReactNode, className = "") {
    if (!mounted || !open) return null;
    return createPortal(
      <div
        ref={popRef}
        className={className}
        style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 80 }}
      >
        {children}
      </div>,
      document.body,
    );
  }

  return { pos, popRef, mounted, portal };
}
