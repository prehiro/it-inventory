"use client";

import { useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { auditView, TONE_CLASS } from "@/lib/audit-format";
import type { AuditView } from "@/lib/audit-format";
import type { Role } from "@/lib/types";
import BackgroundScene from "@/components/ui/background-scene";

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

const QUICK_ACTIONS = [
  { href: "/receive", label: "Receive Items", desc: "Record incoming inventory", icon: <InboxIcon />, gradient: "from-emerald-500 to-emerald-600" },
  { href: "/release", label: "Release Items", desc: "Assign items to employees", icon: <UpIcon />, gradient: "from-indigo-500 to-indigo-600" },
  { href: "/return", label: "Return Items", desc: "Process item returns", icon: <DownIcon />, gradient: "from-slate-500 to-slate-600" },
  { href: "/pc-ledger", label: "PC Ledger", desc: "View PC deployment history", icon: <LedgerIcon />, gradient: "from-violet-500 to-violet-600" },
];

const DONUT_COLORS: Record<string, string> = {
  FA: "#10b981",
  NCA: "#f59e0b",
  GENERAL: "#8b5cf6",
};

/* ─────────────────────────────────────
   Main
   ───────────────────────────────────── */
export function DashboardClient({ data }: { data: DashboardData }) {
  const greeting = getGreeting();
  const hasLowStock = data.lowStock.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-md sm:px-8 sm:py-7">
        <BackgroundScene beamCount={40} />
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{greeting}, <span className="text-indigo-400">Administrator</span></h1>
            <p className="mt-1 text-sm text-slate-400">
              You have <span className="font-semibold text-white">{data.total}</span> items across <span className="font-semibold text-white">{data.models}</span> models in the system
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasLowStock && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1.5 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {data.lowStock.length} low stock
              </span>
            )}
            <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/20">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<BoxIcon />} label="Total Items" value={data.total} color="slate" />
        <StatCard icon={<CheckIcon />} label="Available" value={data.available} color="emerald" />
        <StatCard icon={<ArrowUpIcon />} label="Released" value={data.released} color="indigo" />
        <StatCard icon={<RefreshIcon />} label="In Repair" value={data.inRepair} color="amber" />
        <StatCard icon={<TrashIcon />} label="Plan Dispose" value={data.planDispose} color="rose" />
        <StatCard icon={<GridIcon />} label="Models" value={data.models} color="slate" />
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group relative flex flex-col items-center rounded-2xl bg-gradient-to-br ${a.gradient} p-5 text-center text-white shadow-sm transition hover:shadow-md hover:brightness-110`}
            >
              <div className="mb-3 opacity-80 transition group-hover:scale-110 group-hover:opacity-100">
                {a.icon}
              </div>
              <span className="text-sm font-semibold">{a.label}</span>
              <span className="mt-0.5 text-[11px] leading-tight text-white/70">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Charts Row 1: Donuts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryDonut data={data.donut} />
        <StatusDonut data={data.statusData} total={data.total} />
      </div>

      {/* ── Charts Row 2: Bar + Sidebar ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DepartmentBar data={data.bar} />
          <ModelTypeBar data={data.modelTypes} />
        </div>
        <div className="space-y-4 lg:col-span-1">
          <LowStockAlert items={data.lowStock} />
          <RecentActivity items={data.recent} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Stat card
   ───────────────────────────────────── */
const COLOR_MAP = {
  slate: { bg: "from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900", ring: "ring-slate-200 dark:ring-slate-700/50", iconBg: "bg-slate-100 dark:bg-slate-700", iconColor: "text-slate-600 dark:text-slate-300", text: "text-slate-900 dark:text-slate-100" },
  emerald: { bg: "from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900", ring: "ring-emerald-200 dark:ring-emerald-800/40", iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
  indigo: { bg: "from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900", ring: "ring-indigo-200 dark:ring-indigo-800/40", iconBg: "bg-indigo-100 dark:bg-indigo-500/20", iconColor: "text-indigo-600 dark:text-indigo-400", text: "text-indigo-700 dark:text-indigo-300" },
  amber: { bg: "from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900", ring: "ring-amber-200 dark:ring-amber-800/40", iconBg: "bg-amber-100 dark:bg-amber-500/20", iconColor: "text-amber-600 dark:text-amber-400", text: "text-amber-700 dark:text-amber-300" },
  rose: { bg: "from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900", ring: "ring-rose-200 dark:ring-rose-800/40", iconBg: "bg-rose-100 dark:bg-rose-500/20", iconColor: "text-rose-600 dark:text-rose-400", text: "text-rose-700 dark:text-rose-300" },
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: "slate" | "emerald" | "indigo" | "amber" | "rose" }) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${c.bg} p-4 shadow-sm ring-1 ${c.ring} transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconBg} ${c.iconColor}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${c.text}`}>{value.toLocaleString()}</p>
    </div>
  );
}

/* ─────────────────────────────────────
   Charts
   ───────────────────────────────────── */
function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Assets by Category</h3>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No data</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={`url(#gradient-${d.name})`}
                      stroke={activeIndex === i ? "#066fd1" : "none"}
                      strokeWidth={activeIndex === i ? 2 : 0}
                    />
                  ))}
                </Pie>
                <defs>
                  {data.map((d) => (
                    <linearGradient key={d.name} id={`gradient-${d.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={DONUT_COLORS[d.name] ?? "#64748b"} />
                      <stop offset="100%" stopColor={DONUT_COLORS[d.name] ?? "#64748b"} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percent = Math.round((data.value / total) * 100);
                      return (
                        <div className="rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ background: DONUT_COLORS[data.name] ?? "#64748b" }} />
                            <span className="font-medium">{data.name}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="font-bold">{data.value}</span>
                            <span className="text-slate-500 dark:text-slate-400">({percent}%)</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ background: DONUT_COLORS[d.name] ?? "#64748b" }} />
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.name}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentBar({ data }: { data: { dept: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const [activeBar, setActiveBar] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Released by Department</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No released items</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="dept"
              tick={{ fontSize: 11, fill: "#64748b" }}
              width={40}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const percent = Math.round((d.count / total) * 100);
                  return (
                    <div className="rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.dept}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-bold">{d.count}</span>
                        <span className="text-slate-500 dark:text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              onMouseEnter={(d: any) => setActiveBar(d.dept)}
              onMouseLeave={() => setActiveBar(null)}
            >
              {data.map((d) => (
                <Cell
                  key={d.dept}
                  fill={activeBar === d.dept ? "#4f46e5" : "#066fd1"}
                  fillOpacity={activeBar === d.dept ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   Status Distribution donut (same style as Category)
   ───────────────────────────────────── */
function StatusDonut({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  if (data.length === 0) return null;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Status Distribution</h3>
      <div className="flex items-center gap-6">
        <div className="relative h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={`url(#status-gradient-${d.name.replace(/\s+/g, "")})`}
                    stroke={activeIndex === i ? "#066fd1" : "none"}
                    strokeWidth={activeIndex === i ? 2 : 0}
                  />
                ))}
              </Pie>
              <defs>
                {data.map((d) => (
                  <linearGradient key={d.name} id={`status-gradient-${d.name.replace(/\s+/g, "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={d.color} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const pct = Math.round((d.value / total) * 100);
                    return (
                      <div className="rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                          <span className="font-medium">{d.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="font-bold">{d.value}</span>
                          <span className="text-slate-500 dark:text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Items</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.name}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Model Type breakdown horizontal bars
   ───────────────────────────────────── */
const TYPE_ICONS: Record<string, string> = {
  PC: "🖥️", Laptop: "💻", Tablet: "📱", Mouse: "🖱️",
  Keyboard: "⌨️", Monitor: "🖥️", Projector: "📽️",
  Camera: "📷", CCTV: "📹", Printer: "🖨️",
  Kensington: "🔒", Adaptor: "🔌",
};

function ModelTypeBar({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (data.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Items by Type</h3>
      <div className="space-y-1.5">
        {data.map((d) => {
          const pct = Math.round((d.count / total) * 100);
          return (
            <div key={d.type} className="group flex items-center gap-3">
              <span className="w-5 text-center text-xs">{TYPE_ICONS[d.type] ?? "📦"}</span>
              <span className="w-20 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400">{d.type}</span>
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-[#066fd1] to-indigo-500 px-2 transition-all duration-500"
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-[10px] font-semibold text-white">{d.count}</span>
                  </div>
                </div>
              </div>
              <span className="w-8 text-right text-[10px] text-slate-400">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Low stock alert
   ───────────────────────────────────── */
function LowStockAlert({ items }: { items: { model: string; brand: string; available: number }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-white shadow-sm ring-1 ring-amber-200 dark:from-amber-500/5 dark:to-slate-900 dark:ring-amber-800/40">
      <div className="border-b border-amber-100 px-5 py-3.5 dark:border-amber-800/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Low Stock Alert</h3>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">{items.length} model{items.length > 1 ? "s" : ""} running low</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-amber-100 px-5 dark:divide-amber-800/20">
        {items.map((m) => (
          <div key={m.model} className="flex items-center justify-between py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{m.brand} {m.model}</p>
            </div>
            <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              m.available === 0
                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
            }`}>
              {m.available} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   Recent activity
   ───────────────────────────────────── */
function RecentActivity({ items }: { items: { id: string; action: string; details: string; timestamp: Date; userName: string }[] }) {
  if (items.length === 0)
    return <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">No activity yet.</p>;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((r) => {
          const v: AuditView = auditView(r.action, r.details);
          const Icon = v.icon;
          const date = new Date(r.timestamp);
          const ago = timeAgo(date);
          return (
            <li key={r.id} className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
                    {v.label}
                  </span>
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">{v.summary}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{r.userName} · {ago}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────
   Helpers
   ───────────────────────────────────── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ─────────────────────────────────────
   Icons
   ───────────────────────────────────── */
function BoxIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>; }
function ArrowUpIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>; }
function GridIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>; }
function InboxIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>; }
function UpIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" /></svg>; }
function DownIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" /></svg>; }
function LedgerIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>; }
