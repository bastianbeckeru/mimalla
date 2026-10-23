import ClientSideDashboard from "@/components/dashboard/client-side-dashboard";
import { getCatalog } from "@/server/db/curriculums";

export default function DashboardPage() {
  return <ClientSideDashboard catalog={getCatalog()} />;
}
