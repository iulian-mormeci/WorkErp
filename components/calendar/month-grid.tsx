import Link from "next/link";
import { OccurrenceChip } from "./occurrence-chip";
import { addDays, isSameDay, startOfWeek } from "@/lib/calendar/grid";
import type { Occurrence } from "@/lib/calendar/occurrences";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MAX_VISIBLE_PER_DAY = 3;

export function MonthGrid({
  monthStart,
  occurrencesByDay,
  buildDayHref,
  buildEventHref,
}: {
  monthStart: Date;
  occurrencesByDay: Map<string, Occurrence[]>;
  buildDayHref: (date: Date) => string;
  buildEventHref: (eventoId: string) => string;
}) {
  const gridStart = startOfWeek(monthStart);
  const today = new Date();
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="border-r border-line px-2 py-2 text-xs text-muted last:border-r-0">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((date) => {
          const key = date.toDateString();
          const occurrences = occurrencesByDay.get(key) ?? [];
          const inMonth = date.getMonth() === monthStart.getMonth();
          const isToday = isSameDay(date, today);
          const visible = occurrences.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = occurrences.length - visible.length;

          return (
            <div
              key={key}
              className="flex min-h-[6.5rem] flex-col gap-1 border-r border-b border-line p-1.5 last:border-r-0"
            >
              <Link
                href={buildDayHref(date)}
                className={`w-fit rounded-full px-1.5 text-xs ${
                  isToday
                    ? "bg-pine-strong font-medium text-white"
                    : inMonth
                      ? "text-ink hover:bg-paper"
                      : "text-muted/60 hover:bg-paper"
                }`}
              >
                {date.getDate()}
              </Link>

              <div className="space-y-0.5">
                {visible.map((o) => (
                  <OccurrenceChip key={o.id} occurrence={o} buildEventHref={buildEventHref} />
                ))}
                {overflow > 0 && <p className="px-1.5 text-xs text-muted">+{overflow} altri</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
