import type { AuditLog } from "@prisma/client";

export function RecentActivity({
  items,
}: {
  items: (AuditLog & { user: { name: string } })[];
}) {
  if (items.length === 0)
    return <p className="text-sm text-slate-400">No activity yet.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-xl bg-white ring-1 ring-slate-200">
      {items.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <span className="font-medium text-slate-800">{r.action}</span>
            <span className="ml-2 text-slate-400">{r.details}</span>
          </div>
          <span className="text-xs text-slate-400">
            {r.user.name} · {r.timestamp.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
