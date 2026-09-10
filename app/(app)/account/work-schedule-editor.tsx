import type { WorkSchedule } from "@/lib/generated/prisma/client";
import { DayScheduleRow } from "./day-schedule-row";

// giornoSettimana: 0 = domenica ... 6 = sabato (vedi schema.prisma).
// Visualizzati a partire da lunedì, come d'uso comune.
const DAYS = [
  { value: 1, label: "Lunedì" },
  { value: 2, label: "Martedì" },
  { value: 3, label: "Mercoledì" },
  { value: 4, label: "Giovedì" },
  { value: 5, label: "Venerdì" },
  { value: 6, label: "Sabato" },
  { value: 0, label: "Domenica" },
];

export function WorkScheduleEditor({ schedules }: { schedules: WorkSchedule[] }) {
  return (
    <div className="divide-y divide-line">
      {DAYS.map((day) => (
        <DayScheduleRow
          key={day.value}
          giornoSettimana={day.value}
          label={day.label}
          slots={schedules
            .filter((s) => s.giornoSettimana === day.value)
            .sort((a, b) => a.oraInizio.localeCompare(b.oraInizio))}
        />
      ))}
    </div>
  );
}
