import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getOccurrences } from "@/lib/calendar/occurrences";
import { workingRangesByWeekday } from "@/lib/calendar/work-schedule";
import { addDays, formatDateParam, startOfDay, startOfWeek } from "@/lib/calendar/grid";
import { MiniWeekGrid, type MiniWeekDay } from "@/components/calendar/mini-day-column";
import { WidgetShell } from "./widget-shell";

const FALLBACK_WINDOW = { start: 8 * 60, end: 18 * 60 };

export async function MiniCalendarWidget({ userId, baseDate }: { userId: string; baseDate: Date }) {
  const weekStart = startOfWeek(baseDate);
  const weekEnd = addDays(weekStart, 7);

  const [occurrences, schedules] = await Promise.all([
    getOccurrences(userId, weekStart, weekEnd),
    prisma.workSchedule.findMany({ where: { userId } }),
  ]);

  const rangesByWeekday = workingRangesByWeekday(schedules);

  const days: MiniWeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    return {
      date,
      occurrences: occurrences.filter((o) => o.start < dayEnd && o.end > dayStart),
      workingRanges: rangesByWeekday.get(date.getDay()) ?? [],
    };
  });

  const allRanges = days.flatMap((d) => d.workingRanges);
  const windowStart = allRanges.length > 0 ? Math.min(...allRanges.map((r) => r.start)) : FALLBACK_WINDOW.start;
  const windowEnd = allRanges.length > 0 ? Math.max(...allRanges.map((r) => r.end)) : FALLBACK_WINDOW.end;

  const prevHref = `/?settimana=${formatDateParam(addDays(weekStart, -7))}`;
  const nextHref = `/?settimana=${formatDateParam(addDays(weekStart, 7))}`;
  const todayHref = "/";
  const isCurrentWeek = weekStart.getTime() === startOfWeek(new Date()).getTime();
  const rangeLabel = `${days[0].date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${days[6].date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`;

  return (
    <WidgetShell
      title="Calendario"
      icon={CalendarDays}
      href={`/calendario?vista=settimana&data=${formatDateParam(weekStart)}`}
    >
      <MiniWeekGrid
        days={days}
        windowStart={windowStart}
        windowEnd={windowEnd}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={isCurrentWeek ? undefined : todayHref}
        rangeLabel={rangeLabel}
      />
    </WidgetShell>
  );
}
