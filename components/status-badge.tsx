import type { ItemStatus } from "@/lib/types";

const STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DEPLOYED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  RETURNED_KEEP: "bg-slate-100 text-slate-600 ring-slate-500/20",
  IN_REPAIR: "bg-amber-50 text-amber-700 ring-amber-600/20",
  DISPOSED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const cls = STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
