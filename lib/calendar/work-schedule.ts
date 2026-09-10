import type { WorkSchedule } from "@/lib/generated/prisma/client";

function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** giornoSettimana (0=domenica..6=sabato) -> fasce di lavoro in minuti dalla mezzanotte. */
export function workingRangesByWeekday(
  schedules: WorkSchedule[]
): Map<number, { start: number; end: number }[]> {
  const map = new Map<number, { start: number; end: number }[]>();
  for (const slot of schedules) {
    const ranges = map.get(slot.giornoSettimana) ?? [];
    ranges.push({ start: hhmmToMinutes(slot.oraInizio), end: hhmmToMinutes(slot.oraFine) });
    map.set(slot.giornoSettimana, ranges);
  }
  return map;
}
