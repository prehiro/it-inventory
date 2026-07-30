"use client";

import { useMemo, useState } from "react";

interface SankeyDatum {
  name: string;
  value: number;
  color: string;
}

export function StatusSankey({
  data,
  total,
}: {
  data: SankeyDatum[];
  total: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Sort descending
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  if (sorted.length === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;

  const W = 360;
  const H = 260;
  const leftX = 12; // source node x
  const nodeW = 10;
  const rightX = W - 80; // target node x (leaves room for labels)
  const padY = 14;
  const availH = H - padY * 2;
  const totalVal = total;

  // Compute target node heights & y positions
  const sumV = sorted.reduce((s, d) => s + d.value, 0);
  const gaps = (sorted.length - 1) * 6;
  const share = (availH - gaps) / sumV;

  let cursorY = padY;
  const targets = sorted.map((d) => {
    const h = Math.max(18, d.value * share);
    const y = cursorY;
    cursorY += h + 6;
    return { ...d, y, h };
  });

  // Source node segments: each link occupies a slice of the source node
  let srcCursor = padY;
  const streams = targets.map((t) => {
    const segH = Math.max(18, t.value * share);
    const srcY = srcCursor;
    srcCursor += segH + 6;
    return {
      ...t,
      srcY,
      segH,
      pct: Math.round((t.value / totalVal) * 100),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 260, display: "block" }}
    >
      {/* Definitions: gradients per link */}
      <defs>
        {streams.map((s) => (
          <linearGradient
            key={s.name}
            id={`sg-${s.name.replace(/\s/g, "")}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#1e293b" stopOpacity={0.7} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.7} />
          </linearGradient>
        ))}
      </defs>

      {/* ── Links ── */}
      {streams.map((s) => {
        const x1 = leftX + nodeW;
        const y1 = s.srcY + s.segH / 2;
        const x2 = rightX;
        const y2 = s.y + s.h / 2;
        const thick = Math.max(3, s.segH - 4);
        const mid = (x1 + x2) / 2;
        const isActive = hovered === null || hovered === s.name;

        // Smooth bezier: horizontal control points
        const d = `M ${x1} ${y1 - thick / 2}
          C ${mid} ${y1 - thick / 2}, ${mid} ${y2 - thick / 2}, ${x2} ${y2 - thick / 2}
          L ${x2} ${y2 + thick / 2}
          C ${mid} ${y2 + thick / 2}, ${mid} ${y1 + thick / 2}, ${x1} ${y1 + thick / 2}
          Z`;

        return (
          <g key={s.name}>
            {/* Link shadow */}
            <path
              d={d}
              fill="#000"
              opacity={isActive ? 0.08 : 0.02}
              transform="translate(0, 2)"
              style={{ transition: "opacity 0.25s" }}
            />
            {/* Link */}
            <path
              d={d}
              fill={`url(#sg-${s.name.replace(/\s/g, "")})`}
              opacity={isActive ? 1 : 0.15}
              style={{ transition: "opacity 0.25s, filter 0.25s" }}
              onMouseEnter={() => setHovered(s.name)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            />
            {/* Value label on link */}
            {isActive && s.segH > 24 && (
              <text
                x={x1 + (x2 - x1) * 0.4}
                y={(y1 + y2) / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={11}
                fontWeight={600}
                fontFamily="Inter, system-ui, sans-serif"
                pointerEvents="none"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
              >
                {s.value}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Source node (Total) ── */}
      <rect
        x={leftX}
        y={padY}
        width={nodeW}
        height={availH}
        rx={4}
        fill="#1e293b"
        className="dark:fill-slate-200"
      />
      {/* Total label on left */}
      <text
        x={leftX + nodeW + 6}
        y={padY + 12}
        textAnchor="start"
        dominantBaseline="central"
        fill="#64748b"
        fontSize={10}
        fontWeight={500}
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="0.05em"
      >
        TOTAL
      </text>
      {/* Total value */}
      <text
        x={leftX}
        y={padY + availH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        className="dark:fill-slate-900"
        fontSize={15}
        fontWeight={800}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {total}
      </text>
      {/* Source node segments outline */}
      {streams.map((s) => {
        const isActive = hovered === null || hovered === s.name;
        return (
          <rect
            key={s.name}
            x={leftX}
            y={s.srcY}
            width={nodeW}
            height={s.segH}
            rx={2}
            fill="transparent"
            stroke={s.color}
            strokeWidth={isActive ? 2 : 0}
            opacity={isActive ? 0.8 : 0}
            style={{ transition: "opacity 0.25s" }}
          />
        );
      })}

      {/* ── Target nodes & labels ── */}
      {streams.map((s) => {
        const isActive = hovered === null || hovered === s.name;

        return (
          <g
            key={s.name}
            onMouseEnter={() => setHovered(s.name)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
            style={{ transition: "opacity 0.25s" }}
          >
            {/* Node bar */}
            <rect
              x={rightX}
              y={s.y}
              width={nodeW}
              height={s.h}
              rx={3}
              fill={s.color}
              opacity={isActive ? 1 : 0.2}
              style={{ transition: "opacity 0.25s" }}
            />
            {/* Node bar glow on hover */}
            {hovered === s.name && (
              <rect
                x={rightX - 2}
                y={s.y - 2}
                width={nodeW + 4}
                height={s.h + 4}
                rx={5}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                opacity={0.5}
              />
            )}
            {/* Label — name */}
            <text
              x={rightX + nodeW + 8}
              y={s.y + s.h / 2 - (s.h > 32 ? 5 : 0)}
              textAnchor="start"
              dominantBaseline="central"
              fill={isActive ? s.color : "#cbd5e1"}
              fontSize={12}
              fontWeight={isActive ? 700 : 500}
              fontFamily="Inter, system-ui, sans-serif"
              style={{ transition: "color 0.25s, font-weight 0.25s" }}
            >
              {s.name}
            </text>
            {/* Label — value */}
            <text
              x={rightX + nodeW + 8}
              y={s.y + s.h / 2 + (s.h > 32 ? 9 : 0)}
              textAnchor="start"
              dominantBaseline="central"
              fill={isActive ? "#475569" : "#cbd5e1"}
              fontSize={11}
              fontWeight={500}
              fontFamily="Inter, system-ui, sans-serif"
              style={{ transition: "opacity 0.25s" }}
              opacity={isActive && s.h > 28 ? 1 : 0}
            >
              {s.value} items · {s.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
