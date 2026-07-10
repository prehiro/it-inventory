import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
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
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Return Item</h1>
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
