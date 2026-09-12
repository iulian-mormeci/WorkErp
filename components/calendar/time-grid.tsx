import { CurrentTimeLine } from "./current-time-line";
import { OccurrenceChip } from "./occurrence-chip";
import {
  HOUR_ROW_HEIGHT_PX,
  COMPACT_HOUR_ROW_HEIGHT_PX,
  isSameDay,
  minutesSinceMidnight,
  packOverlaps,
} from "@/lib/calendar/grid";
import type { Occurrence } from "@/lib/calendar/occurrences";

export function TimeGrid({
  days,
  workingRangesByWeekday,
  buildEventHref,
  startHour,
  endHour,
  compact = false,
}: {
  days: { date: Date; occurrences: Occurrence[] }[];
  workingRangesByWeekday: Map<number, { start: number; end: number }[]>;
  buildEventHref: (eventoId: string) => string;
  /** Prima/ultima ora della finestra da mostrare (vedi `computeVisibleHourWindow`). */
  startHour: number;
  endHour: number;
  compact?: boolean;
}) {
  const today = new Date();
  const rowHeight = compact ? COMPACT_HOUR_ROW_HEIGHT_PX : HOUR_ROW_HEIGHT_PX;
  const minBlockHeight = compact ? 8 : 20;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = hours.length * rowHeight;
  const toPx = (minutesSinceStartHour: number) => ((minutesSinceStartHour - startHour * 60) / 60) * rowHeight;

  return (
    <div className="flex rounded-lg border border-line bg-surface">
      <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-line bg-surface">
        <div className="sticky top-0 z-30 h-14 border-b border-line bg-surface" />
        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right text-xs text-muted"
              style={{ top: toPx(h * 60) }}
            >
              {h > startHour && (!compact || h % 2 === 0) && `${String(h).padStart(2, "0")}:00`}
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

              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-line/70"
                    style={{ top: toPx(h * 60) }}
                  />
                ))}

                {workingRanges.map((range, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 bg-pine/[0.06]"
                    style={{
                      top: toPx(range.start),
                      height: toPx(range.end) - toPx(range.start),
                    }}
                  />
                ))}

                {isToday && <CurrentTimeLine rowHeightPx={rowHeight} startHour={startHour} endHour={endHour} />}

                {timedOccurrences.map((o) => {
                  const startMinutes = minutesSinceMidnight(o.start);
                  const durationMinutes = (o.end.getTime() - o.start.getTime()) / 60_000;
                  const widthPct = 100 / o.columns;
                  return (
                    <div
                      key={o.id}
                      className="absolute px-0.5"
                      style={{
                        top: toPx(startMinutes),
                        height: Math.max(minBlockHeight, (durationMinutes / 60) * rowHeight),
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
