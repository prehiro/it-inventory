"use client";

import { useEffect, useRef, useState } from "react";
import { usePopoverPosition } from "@/components/popover";

/* ──────────────────────────────────────────
   BigGooseTooltip — hover popup for truncated table cells.
   Design adapted from Uiverse.io by jarsaniya_1588 (big-goose-52):
   dark gradient bubble (slate-800 → slate-900), glassy hairline border,
   solid 3px left accent (violet default / sky alt / rose warn),
   CSS-triangle arrow, deep soft shadow, spring-bounce entrance.
   Rendered via portal so it's never clipped by the table's
   overflow container; auto-flips upward when no room below.
   ────────────────────────────────────────── */

type Variant = "default" | "alt" | "warn";

const ACCENT: Record<Variant, string> = {
  default: "border-l-violet-400",
  alt: "border-l-sky-400",
  warn: "border-l-rose-400",
};

/* Accent follows the item's category label color (same as CategoryBadge):
   FA → emerald, NCA → amber, GENERAL → purple */
const CATEGORY_ACCENT: Record<string, string> = {
  FA: "border-l-emerald-400",
  NCA: "border-l-amber-400",
  GENERAL: "border-l-purple-400",
};

export function BigGooseTooltip({
  label,
  tooltip,
  variant = "default",
  category,
  width = "auto",
}: {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  variant?: Variant;
  category?: string;
  width?: number | "auto";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { popRef, flipped, portal } = usePopoverPosition({
    open,
    triggerRef,
    width,
    align: "left",
    gap: 8,
  });

  const accent =
    category && CATEGORY_ACCENT[category] ? CATEGORY_ACCENT[category] : ACCENT[variant];

  // Arrow points up when the popover sits BELOW the trigger (common case),
  // points down when usePopoverPosition flipped it above the trigger.
  const isBelow = !flipped;

  // Only show tooltip when the label's text is actually truncated (doesn't fit cell width).
  // scrollWidth can't detect ellipsis clipping (text-overflow doesn't create scrollable
  // overflow), so we probe each text line's natural nowrap width against the trigger's
  // visible width. TreeWalker measures per text node so two-line labels (assignee /
  // location + remarks) are compared line-by-line, not as one concatenated string.
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const measure = () => {
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:fixed;visibility:hidden;pointer-events:none;white-space:nowrap;left:0;top:0;";
      const cs = getComputedStyle(el);
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontSize = cs.fontSize;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      document.body.appendChild(probe);

      let truncated = false;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = (walker.currentNode.textContent ?? "").trim();
        if (!t) continue;
        const parent = walker.currentNode.parentElement;
        if (!parent) continue;
        const pcs = getComputedStyle(parent);
        probe.style.fontFamily = pcs.fontFamily;
        probe.style.fontSize = pcs.fontSize;
        probe.style.fontWeight = pcs.fontWeight;
        probe.style.letterSpacing = pcs.letterSpacing;
        // Available width = the line's own content box (excludes padding). This matters:
        // Location cells have a pin icon + gap before the text (flex-1 truncate span is
        // narrower than the cell), and remark lines have pl-5 padding — comparing against
        // the whole trigger width would miss visually-truncated text.
        const padL = parseFloat(pcs.paddingLeft) || 0;
        const padR = parseFloat(pcs.paddingRight) || 0;
        const avail = parent.clientWidth - padL - padR;
        probe.textContent = t;
        if (probe.getBoundingClientRect().width > (avail > 0 ? avail : el.clientWidth) + 1) {
          truncated = true;
          break;
        }
      }
      document.body.removeChild(probe);
      setIsTruncated(truncated);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [label]);

  const handleMouseEnter = () => {
    if (!isTruncated) return;
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isTruncated) return;
    setOpen(false);
  };

  // Also allow clicking for accessibility (on mobile)
  const handleFocus = () => {
    if (!isTruncated) return;
    setOpen(true);
  };

  const handleBlur = () => {
    if (!isTruncated) return;
    setOpen(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="block min-w-0 w-full cursor-default overflow-hidden"
      >
        {label}
      </span>
      {portal(
        <div ref={popRef}>
          <div
            className={`relative transition-all duration-200 ${
              open ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.97] opacity-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {isBelow ? (
              /* Triangle arrow pointing UP at the trigger (bubble below) — border-b colored */
              <div className="absolute left-4 top-0 -translate-y-1/2 border-x-[6px] border-b-[6px] border-x-transparent border-b-slate-800" />
            ) : (
              /* Triangle arrow pointing DOWN at the trigger (flipped above) — border-t colored */
              <div className="absolute bottom-0 left-4 translate-y-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-slate-900" />
            )}

            {/* Uiverse bubble: dark gradient + glassy ring + 3px left accent */}
            <div
              className={`relative max-w-[280px] rounded-lg border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 px-3.5 py-2 text-xs font-medium tracking-wide text-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm border-l-[3px] ${accent}`}
            >
              {tooltip}
            </div>
          </div>
        </div>,
      )}
    </>
  );
}
