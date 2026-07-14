"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#f43f5e"];

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Assets by Category</h3>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}

export function DepartmentBar({ data }: { data: { dept: string; count: number }[] }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Released by Department</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No released items</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: -20 }}>
            <XAxis dataKey="dept" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
