import { UserRound } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function AccountPage() {
  return (
    <PagePlaceholder
      title="Account"
      description="Dati personali e orario di lavoro."
      icon={UserRound}
    />
  );
}
