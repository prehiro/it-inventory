import { redirect } from "next/navigation";

/* Reports index — redirect to the first sub-page (Received Item) */
export default function ReportsIndexPage() {
  redirect("/reports/received");
}
