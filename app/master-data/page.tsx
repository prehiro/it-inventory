import { requireAuth, requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { CreateModelForm } from "./create-model-form";
import { MasterDataTable, type ModelRow } from "./master-data-table";

export default async function MasterDataPage() {
  await requireRole(await requireAuth(), ["ADMIN"]);

  const models = await prisma.itemModel.findMany({
    where: { isDeleted: false },
    orderBy: [{ type: "asc" }, { brand: "asc" }, { model: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  const rows: ModelRow[] = models.map((m) => ({
    id: m.id,
    type: m.type,
    model: m.model,
    brand: m.brand,
    category: m.category,
    itemCount: m._count.items,
  }));

  return (
    <div>
      <PageHeader title="Master Data" subtitle="Item models in your catalog" />
      <CreateModelForm />
      <MasterDataTable models={rows} />
    </div>
  );
}
