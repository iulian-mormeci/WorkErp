import { CalendarDays } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function CalendarioPage() {
  return (
    <PagePlaceholder
      title="Calendario"
      description="Vista giorno, settimana, mese e anno."
      icon={CalendarDays}
    />
  );
}
