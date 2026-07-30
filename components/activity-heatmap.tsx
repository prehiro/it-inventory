"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo, useCallback } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const DAY = 86400000;

function weekStartOf(ms: number) {
  return ms - new Date(ms).getUTCDay() * DAY;
}

const WEEKDAYS_REV = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ActivityHeatmap({
  items,
}: {
  items: { id: string; action: string; details: string; timestamp: Date; userName: string }[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleCellClick = useCallback(
    (_event: any, _chartContext: any, config: any) => {
      const pt = config?.w?.config?.series?.[config.seriesIndex]?.data?.[config.dataPointIndex];
      if (!pt?.date) return;
      const date = new Date(pt.date);
      const ymd = date.toISOString().slice(0, 10);
      window.location.href = `/admin/audit-trail?from=${ymd}&to=${ymd}`;
    },
    [],
  );

  const series = useMemo(() => {
    const calNow = new Date();
    const calEnd = Date.UTC(calNow.getUTCFullYear(), calNow.getUTCMonth(), calNow.getUTCDate());
    const calStart = calEnd - 83 * DAY;

    const dayCount = new Map<number, number>();
    for (const item of items) {
      const t = new Date(item.timestamp);
      const day = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
    }

    const byDay = WEEKDAYS_REV.map((name) => ({ name, data: [] as { x: number; y: number; date: number }[] }));

    for (let t = calStart; t <= calEnd; t += DAY) {
      const dow = new Date(t).getUTCDay();
      byDay[dow].data.push({ x: weekStartOf(t), y: Math.min(dayCount.get(t) ?? 0, 20), date: t });
    }

    return byDay.reverse();
  }, [items]);

  const calNow = new Date();
  const calEnd = Date.UTC(calNow.getUTCFullYear(), calNow.getUTCMonth(), calNow.getUTCDate());
  const calStart = calEnd - 83 * DAY;
  const calMinX = weekStartOf(calStart) - 3.5 * DAY;
  const calMaxX = weekStartOf(calEnd) + 3.5 * DAY;

  if (!mounted) return null;

  const options: ApexCharts.ApexOptions = {
    series,
    chart: {
      height: 170,
      width: "100%",
      type: "heatmap",
      toolbar: { show: false },
      animations: { enabled: false },
      background: "transparent",
      events: {
        dataPointSelection: handleCellClick,
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["transparent"] },
    legend: { show: false },
    states: { active: { filter: { type: "none" } } },
    plotOptions: {
      heatmap: {
        radius: 3,
        enableShades: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, name: "0", color: "#f1f5f9" },
            { from: 1, to: 1, name: "1", color: "#bbf7d0" },
            { from: 2, to: 3, name: "2-3", color: "#4ade80" },
            { from: 4, to: 7, name: "4-7", color: "#22c55e" },
            { from: 8, to: 100, name: "8+", color: "#15803d" },
          ],
        },
      },
    },
    xaxis: {
      type: "datetime",
      min: calMinX,
      max: calMaxX,
      position: "top",
      labels: {
        format: "MMM",
        datetimeUTC: false,
        style: { colors: "#94a3b8", fontSize: "11px", fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { show: false },
    },
    yaxis: {
      labels: {
        show: true,
        style: { colors: ["#94a3b8"], fontSize: "11px", fontWeight: 500 },
      },
    },
    grid: { yaxis: { lines: { show: false } } },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        const pt = w.config.series[seriesIndex].data[dataPointIndex];
        const n = pt.y;
        const when = new Date(pt.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        const count = n === 0 ? "No activity" : `${n} ${n === 1 ? "activity" : "activities"}`;
        return (
          '<div style="padding:6px 10px;font-size:12px;border-radius:8px;border:1px solid #e2e8f0;background:white;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">' +
          "<b>" +
          count +
          "</b> on " +
          when +
          "</div>"
        );
      },
    },
  };

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s",
      }}
    >
      <div className="flex items-center justify-between px-5 py-3.5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Activity</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Less</span>
          {["#f1f5f9", "#bbf7d0", "#4ade80", "#22c55e", "#15803d"].map((c) => (
            <span key={c} className="inline-block h-3 w-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>
      <div className="px-2 pb-3">
        <Chart options={options} series={series} type="heatmap" height={170} />
      </div>
    </div>
  );
}
