"use client";

import { useRef, useEffect, useState } from "react";
import * as d3Hierarchy from "d3-hierarchy";

interface BubbleDatum {
  name: string;
  value: number;
  color: string;
}

export function PackedBubbleChart({
  data,
  total,
}: {
  data: BubbleDatum[];
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<string | null>(null);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setDim({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    setDim({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Draw bubbles
  useEffect(() => {
    if (!svgRef.current || dim.w === 0 || dim.h === 0 || data.length === 0)
      return;

    const filtered = data.filter((d) => d.value > 0);
    if (filtered.length === 0) return;

    const pack = d3Hierarchy.pack<BubbleDatum>().size([dim.w - 4, dim.h - 4]).padding(4);

    const root = d3Hierarchy
      .hierarchy<BubbleDatum>(
        { name: "root", value: 0, color: "" } as BubbleDatum,
        (d) => {
          // Return children only for the artificial root
          return (d as any).__children ?? undefined;
        },
      )
      .sum((d) => d.value ?? 0);

    // Inject children into root via a separate property
    (root.data as any).__children = filtered;

    const nodes = pack(root).leaves();
    const svg = svgRef.current;
    const ns = "http://www.w3.org/2000/svg";

    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Defs for subtle shadow
    const defs = document.createElementNS(ns, "defs");
    const filter = document.createElementNS(ns, "filter");
    filter.setAttribute("id", "bubble-shadow");
    filter.setAttribute("x", "-10%");
    filter.setAttribute("y", "-10%");
    filter.setAttribute("width", "130%");
    filter.setAttribute("height", "130%");
    const feDropShadow = document.createElementNS(ns, "feDropShadow");
    feDropShadow.setAttribute("dx", "0");
    feDropShadow.setAttribute("dy", "2");
    feDropShadow.setAttribute("stdDeviation", "3");
    feDropShadow.setAttribute("flood-opacity", "0.12");
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);
    svg.appendChild(defs);

    nodes.forEach((node) => {
      const d = node.data as BubbleDatum;
      const r = node.r;
      const cx = node.x;
      const cy = node.y;
      const isActive = active === null || active === d.name;

      // Group for hover effect
      const g = document.createElementNS(ns, "g");
      g.setAttribute("cursor", "pointer");

      // Circle
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", d.color);
      circle.setAttribute("opacity", String(isActive ? 1 : 0.25));
      circle.setAttribute("filter", "url(#bubble-shadow)");
      circle.style.transition = "opacity 0.25s ease";

      // Hover events
      g.addEventListener("mouseenter", () => setActive(d.name));
      g.addEventListener("mouseleave", () => setActive(null));

      g.appendChild(circle);

      // Text
      const text = document.createElementNS(ns, "text");
      text.setAttribute("x", String(cx));
      text.setAttribute("y", String(cy));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", "#fff");
      text.setAttribute("font-size", String(Math.max(9, Math.min(r * 0.55, 16))));
      text.setAttribute("font-weight", "600");
      text.setAttribute("font-family", "Inter, system-ui, sans-serif");
      text.setAttribute("pointer-events", "none");
      text.setAttribute("opacity", String(isActive ? 1 : 0.25));
      text.style.transition = "opacity 0.25s ease";
      text.textContent = d.name;
      g.appendChild(text);

      // Value label
      const valText = document.createElementNS(ns, "text");
      valText.setAttribute("x", String(cx));
      valText.setAttribute("y", String(cy + (r > 24 ? 12 : 0)));
      valText.setAttribute("text-anchor", "middle");
      valText.setAttribute("dominant-baseline", "central");
      valText.setAttribute("fill", "#fff");
      valText.setAttribute("font-size", String(Math.max(8, Math.min(r * 0.3, 13))));
      valText.setAttribute("font-weight", "400");
      valText.setAttribute("font-family", "Inter, system-ui, sans-serif");
      valText.setAttribute("pointer-events", "none");
      valText.setAttribute("opacity", String(isActive ? 0.85 : 0.2));
      valText.style.transition = "opacity 0.25s ease";

      if (r > 30) {
        valText.textContent = `${d.value} items`;
      } else if (r > 16) {
        valText.textContent = String(d.value);
      }
      g.appendChild(valText);

      svg.appendChild(g);
    });
  }, [dim, data, active]);

  if (data.length === 0)
    return (
      <p className="py-8 text-center text-sm text-slate-400">No data</p>
    );

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: 220 }}>
      <svg
        ref={svgRef}
        width={dim.w}
        height={dim.h}
        className="overflow-visible"
      />
      {/* Legend row */}
      <div className="absolute inset-x-0 bottom-1 flex flex-wrap items-center justify-center gap-4">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const isActive = active === null || active === d.name;
          return (
            <button
              key={d.name}
              onMouseEnter={() => setActive(d.name)}
              onMouseLeave={() => setActive(null)}
              className="flex items-center gap-1.5 text-xs transition-opacity"
              style={{ opacity: isActive ? 1 : 0.25 }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: d.color }}
              />
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {d.name}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {d.value}
              </span>
              <span className="text-slate-400 dark:text-slate-500">({pct}%)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
