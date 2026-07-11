import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReturnForm } from "./return-form";

export default async function ReturnPage() {
  await requireAuth();
  const items = await prisma.item.findMany({
    where: { isDeleted: false, status: "DEPLOYED" },
    orderBy: { serialNumber: "asc" },
    select: {
      id: true,
      serialNumber: true,
      transactions: { where: { type: "RELEASE" }, orderBy: { date: "desc" }, take: 1, select: { assigneeName: true } },
    },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Return Item" subtitle="Process items returned by users" />
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No deployed items to return.</p>
      ) : (
        <ReturnForm
          items={items.map((i) => ({
            id: i.id,
            serialNumber: i.serialNumber,
            assignee: i.transactions[0]?.assigneeName ?? "—",
          }))}
        />
      )}
    </div>
  );
}
