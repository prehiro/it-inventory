import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ReleaseForm } from "./release-form";

export default async function ReleasePage() {
  await requireAuth();
  const items = await prisma.item.findMany({
    where: { isDeleted: false, status: "AVAILABLE" },
    orderBy: { serialNumber: "asc" },
    select: { id: true, serialNumber: true, model: { select: { name: true } } },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Release Item" subtitle="Assign an available item to a user" />
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No available items to release.</p>
      ) : (
        <ReleaseForm items={items.map((i) => ({ id: i.id, serialNumber: i.serialNumber, model: i.model.name }))} />
      )}
    </div>
  );
}
