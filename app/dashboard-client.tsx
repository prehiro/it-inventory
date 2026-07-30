"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBar } from "@/components/status-bar";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import type { Role } from "@/lib/types";

/* ─────────────────────────────────────
   Types
   ───────────────────────────────────── */
interface DashboardData {
  total: number;
  available: number;
  released: number;
  returned: number;
  inRepair: number;
  planDispose: number;
  models: number;
  donut: { name: string; value: number }[];
  bar: { dept: string; count: number }[];
  recent: { id: string; action: string; details: string; timestamp: Date; userName: string }[];
  lowStock: { model: string; brand: string; available: number }[];
  role: Role;
  statusData: { name: string; value: number; color: string }[];
  modelTypes: { type: string; count: number }[];
}

const DONUT_COLORS: Record<string, string> = {
  FA: "#10b981",
  NCA: "#f59e0b",
  GENERAL: "#8b5cf6",
};

const QUICK_ACTIONS = [
  { href: "/receive", label: "Receive", icon: <ReceiveIcon /> },
  { href: "/release", label: "Release", icon: <ReleaseIcon /> },
  { href: "/return", label: "Return", icon: <ReturnIcon /> },
  { href: "/pc-ledger", label: "PC Ledger", icon: <LedgerIcon /> },
];

/* ─────────────────────────────────────
   Accent bar colours for stat cards
   ───────────────────────────────────── */
const ACCENT_BAR: Record<string, string> = {
  slate: "bg-slate-400 dark:bg-slate-500",
  emerald: "bg-emerald-500",
  indigo: "bg-[#066fd1]",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

/* ─────────────────────────────────────
   Main
   ───────────────────────────────────── */
export function DashboardClient({ data }: { data: DashboardData }) {
  const greeting = getGreeting();
  const hasLowStock = data.lowStock.length > 0;
  const utilization = data.total > 0 ? Math.round((data.released / data.total) * 100) : 0;
  const health = data.total > 0 ? Math.round(((data.available + data.released) / data.total) * 100) : 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting}, <span className="text-[#066fd1]">Administrator</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {data.total.toLocaleString()} items · {data.models} models ·{" "}
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {utilization}% deployed
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Items" value={data.total} accent="slate" subtitle="All Inventory" index={0} mounted={mounted} />
        <StatCard label="Available" value={data.available} accent="emerald" subtitle="Ready to deploy" index={1} mounted={mounted} />
        <StatCard label="Released" value={data.released} accent="indigo" subtitle="Deployed to user" index={2} mounted={mounted} />
        <StatCard label="In Repair" value={data.inRepair} accent="amber" subtitle="Maintenance / Service" index={3} mounted={mounted} />
        <StatCard label="Plan Dispose" value={data.planDispose} accent="rose" subtitle="Item NG, Scrap, EOL" index={4} mounted={mounted} />
        <StatCard label="Models" value={data.models} accent="slate" subtitle="Equipments Type/Model" index={5} mounted={mounted} />
      </div>

      {/* ── Charts row 1: Donuts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Assets by Category" index={0}>
          <CategoryDonut data={data.donut} />
        </Card>
        <Card title="Status Distribution" index={1}>
          <StatusBar data={data.statusData} total={data.total} />
        </Card>
      </div>

      {/* ── Charts row 2: bars + sidebar ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Items by Type" index={2}>
            <ModelTypeBar data={data.modelTypes} />
          </Card>
          <Card title="Released by Department" index={3}>
            <DepartmentBar data={data.bar} />
          </Card>
          <ActivityHeatmap items={data.recent} />
        </div>
        <div className="space-y-4 lg:col-span-1">
          <LowStockAlert items={data.lowStock} />
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((a, idx) => {
          const delay = 0.35 + idx * 0.06;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#066fd1]/30 hover:shadow-md hover:text-[#066fd1] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#066fd1]/40 dark:hover:text-[#066fd1]"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-[#066fd1]/10 group-hover:text-[#066fd1] dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-[#066fd1]/20">
                {a.icon}
              </span>
              <span>{a.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Card wrapper
   ───────────────────────────────────── */
function Card({ title, children, index = 0 }: { title: string; children: React.ReactNode; index?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const delay = 0.3 + index * 0.1;

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
      }}
    >
      <div className="px-5 py-3.5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────
   Stat card — accent bar at top
   ───────────────────────────────────── */
function StatCard({
  label,
  value,
  accent,
  subtitle,
  index = 0,
  mounted = false,
}: {
  label: string;
  value: number;
  accent: string;
  subtitle: string;
  index?: number;
  mounted?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const delay = 0.15 + index * 0.08;

  useEffect(() => {
    if (!mounted) return;
    const duration = 800;
    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [mounted, value]);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
      }}
    >
      <div
        className={`h-1 w-full ${ACCENT_BAR[accent] ?? "bg-slate-400"}`}
        style={{
          width: mounted ? "100%" : "0%",
          transition: `width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay + 0.15}s`,
        }}
      />
      <div className="px-4 pb-4 pt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {mounted ? displayValue.toLocaleString() : "0"}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Charts
   ───────────────────────────────────── */

function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (total === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data</p>;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        {/* Total badge — before chart so tooltip stacks on top */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.6)",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s",
          }}
        >
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Total</span>
        </div>

        <ResponsiveContainer width={190} height={190}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
              onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={DONUT_COLORS[d.name] ?? "#64748b"}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as { name: string; value: number };
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800" style={{ position: "relative", zIndex: 50 }}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[d.name] ?? "#64748b" }} />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{d.name}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{d.value}</span>
                        <span className="text-[10px] text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2.5">
        {data.map((d, idx) => {
          const pct = Math.round((d.value / total) * 100);
          const isActive = activeIndex === null || activeIndex === data.indexOf(d);
          return (
            <div
              key={d.name}
              className="flex items-center gap-2.5"
              style={{
                opacity: mounted ? (isActive ? 1 : 0.35) : 0,
                transform: mounted ? "translateX(0)" : "translateX(-10px)",
                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.35 + idx * 0.08}s`,
              }}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[d.name] ?? "#64748b" }} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.name}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{d.value}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentBar({ data }: { data: { dept: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No released items</p>;

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease 0.05s",
      }}
    >
      <ResponsiveContainer width="100%" height={210}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 20, right: 16, top: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="dept"
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
            width={80}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload as { dept: string; count: number };
                const pct = Math.round((d.count / total) * 100);
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{d.dept}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{d.count}</span> ({pct}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            onMouseEnter={(d: any) => setActiveBar(d.dept)}
            onMouseLeave={() => setActiveBar(null)}
          >
            {data.map((d, i) => (
              <Cell
                key={d.dept}
                fill={activeBar === d.dept ? "#066fd1" : "#066fd1"}
                fillOpacity={activeBar === d.dept ? 1 : 0.55}
                style={{
                  transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.6 + i * 0.12}s`,
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModelTypeBar({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No items</p>;

  return (
    <div className="space-y-2">
      {data.map((d, idx) => {
        const pct = Math.round((d.count / total) * 100);
        const delay = 0.2 + idx * 0.1;
        return (
          <div
            key={d.type}
            className="flex items-center gap-3"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateX(0)" : "translateX(-12px)",
              transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
            }}
          >
            <span className="w-5 text-center text-xs">{TYPE_ICONS[d.type] ?? "📦"}</span>
            <span className="w-20 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400">{d.type}</span>
            <div className="flex-1">
              <div className="h-5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-[#066fd1] px-2"
                  style={{
                    width: mounted ? `${Math.max(pct, 6)}%` : "0%",
                    transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay + 0.15}s`,
                  }}
                >
                  <span className="text-[10px] font-semibold text-white">{d.count}</span>
                </div>
              </div>
            </div>
            <span
              className="w-8 text-right text-[10px] text-slate-400 dark:text-slate-500"
              style={{
                opacity: mounted ? 1 : 0,
                transition: `opacity 0.4s ease ${delay + 0.3}s`,
              }}
            >
              {mounted ? `${pct}%` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────
   Low stock alert
   ───────────────────────────────────── */
function LowStockAlert({ items }: { items: { model: string; brand: string; available: number }[] }) {
  if (items.length === 0) return null;

  const critical = items.filter((m) => m.available === 0);
  const warning = items.filter((m) => m.available > 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s",
      }}
    >
      <div className="border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0.5)",
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Low Stock</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {critical.length > 0 && <span className="font-medium text-rose-500">{critical.length} out of stock</span>}
              {critical.length > 0 && warning.length > 0 && <span> · </span>}
              {warning.length > 0 && <span>{warning.length} running low</span>}
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
        {/* Out of stock first */}
        {[...critical, ...warning].map((m, idx) => (
          <div
            key={m.model}
            className="flex items-center justify-between py-2.5"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateX(0)" : "translateX(-10px)",
              transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.4 + idx * 0.06}s`,
            }}
          >
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {m.brand} <span className="text-slate-400">{m.model}</span>
            </p>
            <span
              className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.available === 0
                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                : m.available <= 1
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
            >
              {m.available === 0 ? "Out" : `${m.available}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Type icons
   ───────────────────────────────────── */
const TYPE_ICONS: Record<string, string> = {
  PC: "🖥️", Laptop: "💻", Tablet: "📱", Mouse: "🖱️",
  Keyboard: "⌨️", Monitor: "🖥️", Projector: "📽️",
  Camera: "📷", CCTV: "📹", Printer: "🖨️",
  Kensington: "🔒", Adaptor: "🔌",
};

/* ─────────────────────────────────────
   Helpers
   ───────────────────────────────────── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ─────────────────────────────────────
   Icons
   ───────────────────────────────────── */
function ReceiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function ReleaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function LedgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
