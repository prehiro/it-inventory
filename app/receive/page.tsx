import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ReceiveForm } from "./receive-form";

export default async function ReceivePage() {
  await requireAuth();
  const models = await prisma.itemModel.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, brand: true },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Receive Item</h1>
      {models.length === 0 ? (
        <p className="text-sm text-slate-400">No models yet. Add one in Master Data first.</p>
      ) : (
        <ReceiveForm models={models} />
      )}
    </div>
  );
}
