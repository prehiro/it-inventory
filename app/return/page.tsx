import { requireAuth } from "@/lib/auth-utils";
import { PageHeader } from "@/components/page-header";
import { ReturnForm } from "./return-form";

export default async function ReturnPage() {
  await requireAuth();

  return (
    <div className="max-w-4xl">
      <PageHeader title="Return Item" subtitle="Scan a deployed serial to preview, then record the return" />
      <ReturnForm />
    </div>
  );
}
