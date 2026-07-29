import { requireAuth } from "@/lib/auth-utils";
import { PageHeader } from "@/components/page-header";
import { ReleaseForm } from "./release-form";
import { AvailableItemsTable } from "./available-items-table";

export default async function ReleasePage() {
  await requireAuth();

  return (
    <div>
      <PageHeader
        title="Release Item"
        subtitle="Scan a serial to preview, then assign to a user"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
            <line x1="12" y1="3" x2="12" y2="15" className="animate-icon-bounce" style={{ transformOrigin: "12px 12px" }} />
          </svg>
        }
      />
      <ReleaseForm />
      <AvailableItemsTable />
    </div>
  );
}
