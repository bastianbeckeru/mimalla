import { Suspense } from "react";
import ClientSideDashboard, {
  DashboardLoader,
} from "@/components/dashboard/client-side-dashboard";
import { getCatalog } from "@/server/db/curriculums";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <ClientSideDashboard catalog={getCatalog()} />
    </Suspense>
  );
}
