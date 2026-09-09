import { ListChecks } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function AttivitaPage() {
  return (
    <PagePlaceholder
      title="Attività"
      description="Le tue attività, organizzate per stato e con scadenze."
      icon={ListChecks}
    />
  );
}
