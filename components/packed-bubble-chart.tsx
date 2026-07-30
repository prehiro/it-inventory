"use client";

import { useRef, useEffect, useState, useMemo } from "react";

interface BubbleDatum {
  name: string;
  value: number;
  color: string;
}

/* Deterministic greedy circle packing — no Math.random, no overlap */
function packCircles(
  data: BubbleDatum[],
  width: number,
  height: number,
): { x: number; y: number; r: number; d: BubbleDatum }[] {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return [];

  // Scale radii so the largest bubble fills ~40% of the smaller dimension
  const maxVal = Math.max(...filtered.map((d) => d.value));
  const scale = Math.min(width, height) * 0.38 / Math.sqrt(maxVal);
  const items = filtered
    .map((d) => ({ d, r: Math.max(14, Math.sqrt(d.value) * scale) }))
    .sort((a, b) => b.r - a.r);

  const pad = 3;
  const cx = width / 2;
  const cy = height / 2 - 8;
  const placed: { x: number; y: number; r: number }[] = [];

  return items.map((item) => {
    const r = item.r;

    // First item → center
    if (placed.length === 0) {
      placed.push({ x: cx, y: cy, r });
      return { x: cx, y: cy, r, d: item.d };
    }

    // Subsequent items: spiral search outward from center
    let bestX = cx + r;
    let bestY = cy;
    let bestDist = Infinity;

    for (let angle = 0; angle < Math.PI * 16; angle += 0.15) {
      const spiralR = 2 + angle * r * 0.12;
      const x = cx + Math.cos(angle) * spiralR;
      const y = cy + Math.sin(angle) * spiralR;

      // Bounds check
      if (x - r < 2 || x + r > width - 2 || y - r < 2 || y + r > height - 2)
        continue;

      let ok = true;
      let minDist = Infinity;
      for (const p of placed) {
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minGap = r + p.r + pad;
        if (dist < minGap) { ok = false; break; }
        if (dist < minDist) minDist = dist;
      }

      if (ok) {
        placed.push({ x, y, r });
        return { x, y, r, d: item.d };
      }

      // Track the "least bad" position as fallback
      if (minDist! > bestDist) {
        bestDist = minDist!;
        bestX = x;
        bestY = y;
      }
    }

    // Fallback: compress at best available spot (allow slight overlap)
    placed.push({ x: bestX, y: bestY, r });
    return { x: bestX, y: bestY, r, d: item.d };
  });
}

export function PackedBubbleChart({
  data,
  total,
}: {
  data: BubbleDatum[];
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 300, h: 200 });
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // Mount only on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0)
          setDim({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    const { clientWidth, clientHeight } = el;
    if (clientWidth > 0 && clientHeight > 0)
      setDim({ w: clientWidth, h: clientHeight });
    return () => ro.disconnect();
  }, []);

  const bubbles = useMemo(
    () => packCircles(data, dim.w, dim.h),
    [data, dim.w, dim.h],
  );

  if (data.length === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: 220 }}>
      {mounted ? (
        <svg width={dim.w} height={dim.h} className="overflow-visible">
          {bubbles.map((b) => {
            const isActive = active === null || active === b.d.name;
            const fontSize = Math.max(10, Math.min(b.r * 0.5, 16));
            const showValue = b.r > 20;

            return (
              <g
                key={b.d.name}
                cursor="pointer"
                onMouseEnter={() => setActive(b.d.name)}
                onMouseLeave={() => setActive(null)}
                style={{ transition: "opacity 0.2s" }}
              >
                {/* Invisible hit area */}
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={b.r + 4}
                  fill="transparent"
                  opacity={0}
                />
                {/* Bubble */}
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={b.r}
                  fill={b.d.color}
                  opacity={isActive ? 0.95 : 0.2}
                  style={{
                    transition: "opacity 0.25s ease",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                  }}
                />
                {/* Label */}
                <text
                  x={b.x}
                  y={b.y - (showValue ? 5 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={fontSize}
                  fontWeight={700}
                  fontFamily="Inter, system-ui, sans-serif"
                  pointerEvents="none"
                  opacity={isActive ? 1 : 0.2}
                  style={{ transition: "opacity 0.25s ease" }}
                >
                  {b.d.name}
                </text>
                {/* Value */}
                {showValue && (
                  <text
                    x={b.x}
                    y={b.y + fontSize * 0.55 + 4}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={Math.max(9, Math.min(b.r * 0.26, 12))}
                    fontWeight={400}
                    fontFamily="Inter, system-ui, sans-serif"
                    pointerEvents="none"
                    opacity={isActive ? 0.9 : 0.15}
                    style={{ transition: "opacity 0.25s ease" }}
                  >
                    {b.d.value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ height: dim.h }} />
      )}

      {/* Legend */}
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
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: d.color }}
              />
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {d.name}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {d.value}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                ({pct}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
