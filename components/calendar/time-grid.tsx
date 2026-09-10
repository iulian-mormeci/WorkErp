import { CurrentTimeLine } from "./current-time-line";
import { OccurrenceChip } from "./occurrence-chip";
import {
  HOUR_ROW_HEIGHT_PX,
  DAY_GRID_HEIGHT_PX,
  isSameDay,
  minutesSinceMidnight,
  packOverlaps,
} from "@/lib/calendar/grid";
import type { Occurrence } from "@/lib/calendar/occurrences";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimeGrid({
  days,
  workingRangesByWeekday,
  buildEventHref,
}: {
  days: { date: Date; occurrences: Occurrence[] }[];
  workingRangesByWeekday: Map<number, { start: number; end: number }[]>;
  buildEventHref: (eventoId: string) => string;
}) {
  const today = new Date();

  return (
    <div className="flex rounded-lg border border-line bg-surface">
      <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-line bg-surface">
        <div className="sticky top-0 z-30 h-14 border-b border-line bg-surface" />
        <div className="relative" style={{ height: DAY_GRID_HEIGHT_PX }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right text-xs text-muted"
              style={{ top: h * HOUR_ROW_HEIGHT_PX }}
            >
              {h > 0 && `${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {days.map(({ date, occurrences }) => {
          const isToday = isSameDay(date, today);
          const allDayOccurrences = occurrences.filter((o) => o.allDay);
          const timedOccurrences = packOverlaps(occurrences.filter((o) => !o.allDay));
          const workingRanges = workingRangesByWeekday.get(date.getDay()) ?? [];

          return (
            <div
              key={date.toISOString()}
              className="min-w-[8rem] flex-1 border-r border-line last:border-r-0"
            >
              <div className="sticky top-0 z-30 flex h-14 flex-col items-center justify-center gap-0.5 border-b border-line bg-surface">
                <span className="text-xs text-muted capitalize">
                  {date.toLocaleDateString("it-IT", { weekday: "short" })}
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-sm ${
                    isToday ? "bg-pine-strong font-medium text-white" : "text-ink"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {allDayOccurrences.length > 0 && (
                <div className="space-y-0.5 border-b border-line p-1">
                  {allDayOccurrences.map((o) => (
                    <OccurrenceChip key={o.id} occurrence={o} buildEventHref={buildEventHref} />
                  ))}
                </div>
              )}

              <div className="relative" style={{ height: DAY_GRID_HEIGHT_PX }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-line/70"
                    style={{ top: h * HOUR_ROW_HEIGHT_PX }}
                  />
                ))}

                {workingRanges.map((range, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 bg-pine/[0.06]"
                    style={{
                      top: (range.start / 60) * HOUR_ROW_HEIGHT_PX,
                      height: ((range.end - range.start) / 60) * HOUR_ROW_HEIGHT_PX,
                    }}
                  />
                ))}

                {isToday && <CurrentTimeLine />}

                {timedOccurrences.map((o) => {
                  const startMinutes = minutesSinceMidnight(o.start);
                  const durationMinutes = Math.max(20, (o.end.getTime() - o.start.getTime()) / 60_000);
                  const widthPct = 100 / o.columns;
                  return (
                    <div
                      key={o.id}
                      className="absolute px-0.5"
                      style={{
                        top: (startMinutes / 60) * HOUR_ROW_HEIGHT_PX,
                        height: (durationMinutes / 60) * HOUR_ROW_HEIGHT_PX,
                        left: `${o.column * widthPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      <OccurrenceChip occurrence={o} buildEventHref={buildEventHref} fill />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
