import Link from "next/link";
import { addDays, isSameDay, startOfWeek } from "@/lib/calendar/grid";
import type { Occurrence } from "@/lib/calendar/occurrences";

const MONTH_LABELS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function MiniMonth({
  year,
  month,
  occurrencesByDay,
  buildDayHref,
}: {
  year: number;
  month: number;
  occurrencesByDay: Map<string, Occurrence[]>;
  buildDayHref: (date: Date) => string;
}) {
  const monthStart = new Date(year, month, 1);
  const gridStart = startOfWeek(monthStart);
  const today = new Date();
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  // Alcuni mesi non riempiono l'ultima riga: la nascondiamo se è tutta fuori mese.
  const lastRowInMonth = days.slice(35).some((d) => d.getMonth() === month);
  const visibleDays = lastRowInMonth ? days : days.slice(0, 35);

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="mb-2 text-sm font-medium text-ink">{MONTH_LABELS[month]}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {visibleDays.map((date) => {
          const inMonth = date.getMonth() === month;
          const isToday = isSameDay(date, today);
          const hasOccurrences = (occurrencesByDay.get(date.toDateString())?.length ?? 0) > 0;

          return (
            <Link
              key={date.toDateString()}
              href={buildDayHref(date)}
              className="flex flex-col items-center gap-0.5 py-0.5"
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-pine-strong font-medium text-white"
                    : inMonth
                      ? "text-ink hover:bg-paper"
                      : "text-muted/50"
                }`}
              >
                {date.getDate()}
              </span>
              <span className={`size-1 rounded-full ${hasOccurrences ? "bg-pine" : ""}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function YearGrid({
  year,
  occurrencesByDay,
  buildDayHref,
}: {
  year: number;
  occurrencesByDay: Map<string, Occurrence[]>;
  buildDayHref: (date: Date) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {MONTH_LABELS.map((_, month) => (
        <MiniMonth
          key={month}
          year={year}
          month={month}
          occurrencesByDay={occurrencesByDay}
          buildDayHref={buildDayHref}
        />
      ))}
    </div>
  );
}
