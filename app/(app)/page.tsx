import { LayoutDashboard } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Calendario della giornata, prossimi impegni e attività da fare."
      icon={LayoutDashboard}
    />
  );
}
