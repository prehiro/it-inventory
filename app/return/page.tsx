import { requireAuth } from "@/lib/auth-utils";
import { PageHeader } from "@/components/page-header";
import { ReturnForm } from "./return-form";

export default async function ReturnPage() {
  await requireAuth();

  return (
    <div>
      <PageHeader
        title="Return Item"
        subtitle="Scan a deployed serial to preview, then record the return"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14l-4-4 4-4" className="animate-return-nudge" style={{ transformOrigin: "7px 12px" }} />
            <path d="M5 10h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3" />
          </svg>
        }
      />
      <ReturnForm />
    </div>
  );
}
