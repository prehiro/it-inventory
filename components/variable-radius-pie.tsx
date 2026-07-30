"use client";

import { useRef, useEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface SliceDatum {
  name: string;
  value: number;
  color: string;
}

// Soft professional palette
const FALLBACK_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316",
];

export function VariableRadiusPie({
  data,
  total,
}: {
  data: SliceDatum[];
  total: number;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Dispose previous
    rootRef.current?.dispose();

    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
      }),
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        alignLabels: true,
        calculateAggregates: true,
        valueField: "value",
        categoryField: "name",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{category}: {value} ({valuePercentTotal.formatNumber('0.0')}%)",
        }),
      }),
    );

    // White stroke between slices
    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
    });

    // Variable radius adapter — each slice's radius proportional to its value
    // but never smaller than 30% of max radius so tiny slices stay visible
    series.slices.template.adapters.add("radius", (radius, target) => {
      const dataItem = target.dataItem;
      const high = series.getPrivate("valueHigh");
      if (dataItem && high && radius != null) {
        const value = (dataItem.get("valueWorking" as any) as number) ?? 0;
        const ratio = value / high;
        // Clamp ratio so smallest slice is at least 0.35 of max
        const clamped = Math.max(0.35, ratio);
        return radius * clamped;
      }
      return radius;
    });

    // Label position
    series.labelsContainer.set("paddingTop", 20);

    // Set data with colors
    series.data.setAll(
      data.map((d, i) => ({
        name: d.name,
        value: d.value,
        fill: am5.color(d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
      })),
    );

    // Legend
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 10,
        marginBottom: 5,
      }),
    );
    legend.data.setAll(series.dataItems);

    // Animate in
    series.appear(1000, 100);

    return () => {
      root.dispose();
      rootRef.current = null;
    };
  }, [data]);

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;
  }

  return (
    <div
      ref={chartRef}
      style={{ width: "100%", height: 300 }}
    />
  );
}
