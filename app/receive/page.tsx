import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReceiveTabs } from "./receive-tabs";

export default async function ReceivePage() {
  await requireAuth();
  const models = await prisma.itemModel.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: { id: true, type: true, name: true, brand: true, category: true },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Receive Item" subtitle="Log incoming IT items from logistics" />
      {models.length === 0 ? (
        <p className="text-sm text-slate-400">No models yet. Add one in Master Data first.</p>
      ) : (
        <ReceiveTabs models={models} />
      )}
    </div>
  );
}
