import { StickyNote } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function NotePage() {
  return (
    <PagePlaceholder
      title="Note"
      description="Le tue note personali, libere."
      icon={StickyNote}
    />
  );
}
