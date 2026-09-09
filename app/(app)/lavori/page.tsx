import { Wrench } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function LavoriPage() {
  return (
    <PagePlaceholder
      title="Lavori"
      description="Lavori manuali e sincronizzati da UnoERP."
      icon={Wrench}
    />
  );
}
