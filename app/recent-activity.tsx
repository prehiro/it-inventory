import type { AuditLog } from "@prisma/client";
import { auditView, TONE_CLASS } from "@/lib/audit-format";

export function RecentActivity({
  items,
}: {
  items: (AuditLog & { user: { name: string } })[];
}) {
  if (items.length === 0)
    return <p className="text-sm text-slate-400">No activity yet.</p>;

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {items.map((r) => {
        const v = auditView(r.action, r.details);
        const Icon = v.icon;
        return (
          <li key={r.id} className="row-hover flex items-center gap-3 px-5 py-3.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[v.tone]}`}>{v.label}</span>
                <span className="truncate text-sm text-slate-600">{v.summary}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{r.user.name} · {r.timestamp.toLocaleString()}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
