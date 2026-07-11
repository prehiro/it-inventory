import type { AuditLog } from "@prisma/client";

export function RecentActivity({
  items,
}: {
  items: (AuditLog & { user: { name: string } })[];
}) {
  if (items.length === 0)
    return <p className="text-sm text-slate-400">No activity yet.</p>;

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {items.map((r) => (
        <li key={r.id} className="row-hover flex items-center justify-between px-5 py-3.5 text-sm">
          <div className="min-w-0">
            <span className="font-medium text-slate-800">{r.action}</span>
            <span className="ml-2 truncate text-slate-400">{r.details}</span>
          </div>
          <span className="ml-4 shrink-0 text-xs text-slate-400">
            {r.user.name} · {r.timestamp.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
