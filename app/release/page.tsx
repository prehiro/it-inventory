import { requireAuth } from "@/lib/auth-utils";
import { PageHeader } from "@/components/page-header";
import { ReleaseForm } from "./release-form";
import { AvailableItemsTable } from "./available-items-table";

export default async function ReleasePage() {
  await requireAuth();

  return (
    <div className="max-w-4xl">
      <PageHeader title="Release Item" subtitle="Scan a serial to preview, then assign to a user" />
      <ReleaseForm />
      <AvailableItemsTable />
    </div>
  );
}
