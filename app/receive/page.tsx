import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReceiveTabs } from "./receive-tabs";

export default async function ReceivePage() {
  await requireAuth();
  const models = await prisma.itemModel.findMany({
    where: { isDeleted: false },
    orderBy: [{ category: "asc" }, { type: "asc" }, { brand: "asc" }],
    select: { id: true, type: true, model: true, brand: true, category: true },
  });

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 8.5rem)" }}>
      <PageHeader
        title="Receive Item"
        subtitle="Log incoming IT items from logistics & suppliers"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
            <line x1="12" y1="15" x2="12" y2="3" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
          </svg>
        }
        action={
          <span className="hidden sm:flex items-center gap-1.5 rounded-md bg-[#2563eb]/5 px-3 py-1.5 text-xs font-medium text-[#2563eb] dark:bg-[#2563eb]/10 dark:text-[#2563eb]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {models.length} model{models.length !== 1 ? "s" : ""} available
          </span>
        }
      />
      {models.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 dark:border-slate-700 dark:bg-slate-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No item models found</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Add models in Master Data before receiving items</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ReceiveTabs models={models} />
        </div>
      )}
    </div>
  );
}
