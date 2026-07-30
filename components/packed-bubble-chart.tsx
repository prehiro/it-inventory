"use client";
import { useRef, useEffect, useState, useMemo } from "react";

interface BubbleDatum {
  name: string;
  value: number;
  color: string;
}

/* Simple circle-packing via greedy placement */
function packCircles(
  data: BubbleDatum[],
  width: number,
  height: number,
): { x: number; y: number; r: number; d: BubbleDatum }[] {
  const items = data
    .filter((d) => d.value > 0)
    .map((d) => ({ d, r: Math.sqrt(d.value) * 6 + 16 }))
    .sort((a, b) => b.r - a.r);

  const placed: { x: number; y: number; r: number }[] = [];
  const margin = 6;
  const cx = width / 2;
  const cy = height / 2 - 10;

  return items.map((item) => {
    let x = cx;
    let y = cy;

    // Try to place near center, push outward if overlapping
    let iterations = 0;
    while (iterations < 300) {
      let overlap = false;
      for (const p of placed) {
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = item.r + p.r + margin;
        if (dist < minDist) {
          overlap = true;
          // Push away
          if (dist < 1) {
            x += Math.random() * 10 - 5;
            y += Math.random() * 10 - 5;
          } else {
            const push = (minDist - dist) * 0.5;
            x += (dx / dist) * -push;
            y += (dy / dist) * -push;
          }
          break;
        }
      }
      if (!overlap) break;
      iterations++;
    }

    // Clamp to bounds
    const half = item.r + margin;
    x = Math.max(half, Math.min(width - half, x));
    y = Math.max(half, Math.min(height - half, y));

    placed.push({ x, y, r: item.r });
    return { x, y, r: item.r, d: item.d };
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
  const [active, setActive] = useState<string | null>(null);

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
      <svg width={dim.w} height={dim.h} className="overflow-visible">
        {bubbles.map((b) => {
          const isActive = active === null || active === b.d.name;
          const fontSize = Math.max(9, Math.min(b.r * 0.52, 16));
          const showValue = b.r > 18;

          return (
            <g
              key={b.d.name}
              cursor="pointer"
              onMouseEnter={() => setActive(b.d.name)}
              onMouseLeave={() => setActive(null)}
              style={{ transition: "opacity 0.2s" }}
            >
              {/* Shadow circle */}
              <circle
                cx={b.x}
                cy={b.y}
                r={b.r}
                fill="transparent"
                opacity={isActive ? 1 : 0.25}
                style={{ transition: "opacity 0.25s ease" }}
              />
              {/* Main circle */}
              <circle
                cx={b.x}
                cy={b.y}
                r={b.r}
                fill={b.d.color}
                opacity={isActive ? 1 : 0.25}
                style={{
                  transition: "opacity 0.25s ease",
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.12))",
                }}
              />
              {/* Label */}
              <text
                x={b.x}
                y={b.y - (showValue ? 5 : 1)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={fontSize}
                fontWeight={600}
                fontFamily="Inter, system-ui, sans-serif"
                pointerEvents="none"
                opacity={isActive ? 1 : 0.25}
                style={{ transition: "opacity 0.25s ease" }}
              >
                {b.d.name}
              </text>
              {/* Value */}
              {showValue && (
                <text
                  x={b.x}
                  y={b.y + fontSize * 0.5 + 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={Math.max(8, Math.min(b.r * 0.28, 12))}
                  fontWeight={400}
                  fontFamily="Inter, system-ui, sans-serif"
                  pointerEvents="none"
                  opacity={isActive ? 0.85 : 0.2}
                  style={{ transition: "opacity 0.25s ease" }}
                >
                  {b.d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>

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
                className="h-2 w-2 rounded-full"
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
