import { BookOpen } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function ManualiPage() {
  return (
    <PagePlaceholder
      title="Manuali e guide"
      description="Cerca per marca, modello e categoria."
      icon={BookOpen}
    />
  );
}
