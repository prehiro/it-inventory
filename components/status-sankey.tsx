"use client";

import { useMemo } from "react";

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
  const W = 320;
  const H = 240;
  const nodeW = 10;
  const gap = 8;
  const topPad = 8;
  const botPad = 8;
  const availableH = H - topPad - botPad;

  // Sort by value descending
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  if (sorted.length === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;

  // Compute node positions (right side)
  const totalVal = sorted.reduce((s, d) => s + d.value, 0);
  const rightNodes = sorted.map((d) => {
    const h = Math.max(20, (d.value / totalVal) * availableH);
    return { ...d, h };
  });

  // Distribute vertically with gaps
  const totalH = rightNodes.reduce((s, d) => s + d.h, 0);
  const extraGap =
    rightNodes.length > 1
      ? (availableH - totalH - gap * (rightNodes.length - 1)) /
        rightNodes.length
      : 0;

  let rightY = topPad;
  const positioned = rightNodes.map((d) => {
    const nodeH = d.h + Math.max(0, extraGap);
    const y = rightY;
    rightY += nodeH + gap;
    return { ...d, y, nodeH, h: nodeH };
  });

  // Source: Total node (left side)
  const sourceX = 8;
  const sourceY = topPad;
  const sourceH = availableH;

  // Draw links
  const paths: {
    d: string;
    color: string;
    name: string;
    value: number;
    pct: number;
  }[] = [];

  positioned.forEach((node) => {
    // Cubic bezier from source right edge to node left edge
    const x1 = sourceX + nodeW; // source right
    const y1 = sourceY + (sourceH * node.value) / totalVal;
    const w1 = (sourceH * node.value) / totalVal;

    const x2 = W - nodeW - 8; // node left
    const y2 = node.y;

    // Link thickness proportional to value
    const linkH = Math.max(6, node.h - 4);

    const mid = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2} L ${x2} ${y2 + linkH} C ${mid} ${y2 + linkH}, ${mid} ${y1 + linkH}, ${x1} ${y1 + linkH} Z`;

    paths.push({
      d: path,
      color: node.color,
      name: node.name,
      value: node.value,
      pct: Math.round((node.value / total) * 100),
    });
  });

  // Right side labels
  const rightLabelX = W - nodeW - 10;
  const rightLabelOffset = -6;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxWidth: 380, height: H, display: "block", margin: "0 auto" }}
    >
      {/* Source node */}
      <rect
        x={sourceX}
        y={sourceY}
        width={nodeW}
        height={sourceH}
        rx={3}
        fill="#0f172a"
        className="dark:fill-slate-100"
      />
      <text
        x={sourceX + nodeW / 2}
        y={sourceY + sourceH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={11}
        fontWeight={700}
        fontFamily="Inter, sans-serif"
      >
        {total}
      </text>

      {/* Right nodes + labels */}
      {positioned.map((node) => (
        <g key={node.name}>
          <rect
            x={W - nodeW - 8}
            y={node.y}
            width={nodeW}
            height={node.nodeH}
            rx={3}
            fill={node.color}
          />
          <text
            x={rightLabelX + rightLabelOffset}
            y={node.y + node.nodeH / 2}
            textAnchor="end"
            dominantBaseline="central"
            fill={node.color}
            fontSize={11}
            fontWeight={600}
            fontFamily="Inter, sans-serif"
          >
            {node.name}
          </text>
        </g>
      ))}

      {/* Links */}
      {paths.map((p) => (
        <g key={p.name}>
          <path
            d={p.d}
            fill={p.color}
            opacity={0.5}
            className="transition-opacity hover:opacity-80"
          />
          {/* Value label on link */}
          <text
            x={(sourceX + nodeW + W - nodeW - 8) / 2}
            y={
              sourceY +
              (sourceH * p.value) / totalVal +
              Math.max(6, (positioned.find((n) => n.name === p.name)?.h ?? 20) - 4) / 2
            }
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={10}
            fontWeight={500}
            fontFamily="Inter, sans-serif"
            pointerEvents="none"
          >
            {p.value} ({p.pct}%)
          </text>
        </g>
      ))}
    </svg>
  );
}
