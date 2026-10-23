import ClientSideDashboard from "@/components/dashboard/client-side-dashboard";
import { getCachedCatalog } from "@/server/catalog/cached-catalog";

export default async function DashboardPage() {
  return <ClientSideDashboard catalog={await getCachedCatalog()} />;
}
