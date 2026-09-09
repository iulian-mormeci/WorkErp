import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function ImpostazioniPage() {
  return (
    <PagePlaceholder
      title="Impostazioni"
      description="Preferenze generali e integrazioni."
      icon={Settings}
    />
  );
}
