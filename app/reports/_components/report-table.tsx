import { StatusBadge } from "@/components/status-badge";

/* ──────────────────────────────────────────
   Shared ReportTable — grouping + rows + pagination
   Used by all Reports sub-pages (received/released/returned/movement)
   ────────────────────────────────────────── */

export type TxnRow = {
  id: string;
  type: string;
  statusAfter: string;
  date: Date;
  assigneeName: string | null;
  returningPicName: string | null;
  remarks: string | null;
  item: { serialNumber: string; status: string };
  operator: { name: string };
};

export function groupByDay(txns: TxnRow[]) {
  const groups: { key: string; date: Date; items: TxnRow[] }[] = [];
  for (const t of txns) {
    const d = new Date(t.date.getFullYear(), t.date.getMonth(), t.date.getDate());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(t);
    else groups.push({ key, date: d, items: [t] });
  }
  return groups;
}

export function isToday(d: Date) {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export const dayFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const typeLabel: Record<string, string> = { RECEIVE: "Received", RELEASE: "Released", RETURN: "Returned" };

export function ReportTable({
  groups,
  columns,
}: {
  groups: { key: string; date: Date; items: TxnRow[] }[];
  columns: "movement" | "received" | "released" | "returned";
}) {
  const showType = columns === "movement";
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
        <tr>
          {showType && <th className="px-5 py-3">Type</th>}
          <th className="px-5 py-3">Serial</th>
          <th className="px-5 py-3">Status</th>
          <th className="px-5 py-3">Operator</th>
          <th className="px-5 py-3">Remark / Assignee / Returner</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {groups.map((g) => (
          <GroupRows key={g.key} group={g} showType={showType} />
        ))}
        {groups.length === 0 && (
          <tr>
            <td colSpan={showType ? 5 : 4} className="px-5 py-8 text-center text-slate-400">
              No transactions match.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function GroupRows({ group, showType }: { group: { key: string; date: Date; items: TxnRow[] }; showType: boolean }) {
  return (
    <>
      <tr className="bg-slate-50/80 dark:bg-slate-800/40">
        <td colSpan={showType ? 5 : 4} className="px-5 py-2.5">
          <div className="flex items-center gap-2">
            {isToday(group.date) && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Today
              </span>
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {dayFmt.format(group.date)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {group.items.length} item{group.items.length === 1 ? "" : "s"}
            </span>
          </div>
        </td>
      </tr>
      {group.items.map((t) => (
        <tr key={t.id} className="row-hover">
          {showType && (
            <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{typeLabel[t.type] ?? t.type}</td>
          )}
          <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{t.item.serialNumber}</td>
          <td className="px-5 py-3"><StatusBadge status={t.statusAfter} /></td>
          <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.operator.name}</td>
          <td className="px-5 py-3">
            {t.type === "RECEIVE" && (
              <span className="text-slate-500 dark:text-slate-400">{t.remarks || "—"}</span>
            )}
            {t.type === "RELEASE" && (
              <span className="text-slate-500 dark:text-slate-400">{t.assigneeName || "—"}</span>
            )}
            {t.type === "RETURN" && (
              <span className="text-slate-500 dark:text-slate-400">{t.returningPicName || "—"}</span>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}
