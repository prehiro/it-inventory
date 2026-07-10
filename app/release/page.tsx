import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ReleaseForm } from "./release-form";

export default async function ReleasePage() {
  await requireAuth();
  const items = await prisma.item.findMany({
    where: { isDeleted: false, status: "AVAILABLE" },
    orderBy: { serialNumber: "asc" },
    select: { id: true, serialNumber: true, model: { select: { name: true } } },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Release Item</h1>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No available items to release.</p>
      ) : (
        <ReleaseForm items={items.map((i) => ({ id: i.id, serialNumber: i.serialNumber, model: i.model.name }))} />
      )}
    </div>
  );
}
