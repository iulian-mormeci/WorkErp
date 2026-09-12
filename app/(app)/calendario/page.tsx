import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getOccurrences } from "@/lib/calendar/occurrences";
import { workingRangesByWeekday } from "@/lib/calendar/work-schedule";
import {
  addDays,
  computeVisibleHourWindow,
  formatDateParam,
  getVistaRange,
  parseDateParam,
  startOfDay,
  startOfMonth,
} from "@/lib/calendar/grid";
import { ViewSwitcher, isCalendarVista, type CalendarVista } from "@/components/calendar/view-switcher";
import { TimeGrid } from "@/components/calendar/time-grid";
import { MonthGrid } from "@/components/calendar/month-grid";
import { YearGrid } from "@/components/calendar/year-grid";
import { EventFormPanel } from "@/components/calendar/event-form-panel";
import { AutoScrollToHour } from "@/components/calendar/auto-scroll";

function buildHref(vista: CalendarVista, date: Date, opts?: { evento?: string; compatta?: boolean }) {
  const params = new URLSearchParams({ vista, data: formatDateParam(date) });
  if (opts?.evento) params.set("evento", opts.evento);
  if (opts?.compatta) params.set("compatta", "1");
  return `/calendario?${params.toString()}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; data?: string; evento?: string; compatta?: string }>;
}) {
  const user = await requireUser();
  const { vista: vistaParam, data: dataParam, evento, compatta: compattaParam } = await searchParams;

  const vista: CalendarVista = isCalendarVista(vistaParam) ? vistaParam : "settimana";
  const focusDate = parseDateParam(dataParam);
  const compatta = compattaParam === "1" && (vista === "giorno" || vista === "settimana");
  const { start, end } = getVistaRange(vista, focusDate);

  const [occurrences, schedules] = await Promise.all([
    getOccurrences(user.id, start, end),
    prisma.workSchedule.findMany({ where: { userId: user.id } }),
  ]);
  const workingRanges = workingRangesByWeekday(schedules);

  let eventoEdit = null;
  if (evento && evento !== "nuovo") {
    eventoEdit = await prisma.event.findFirst({ where: { id: evento, userId: user.id } });
    if (!eventoEdit) notFound();
  }

  const closeHref = buildHref(vista, focusDate, { compatta });

  return (
    <div className="flex flex-col gap-4 px-6 py-8 md:px-10 md:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Calendario</h1>
          <p className="mt-1 text-sm text-muted">Eventi, attività in scadenza e lavori programmati.</p>
        </div>
        {!evento && (
          <Link
            href={buildHref(vista, focusDate, { evento: "nuovo", compatta })}
            className="rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Nuovo evento
          </Link>
        )}
      </header>

      {evento && (
        <EventFormPanel
          event={eventoEdit ?? undefined}
          defaultDate={focusDate}
          closeHref={closeHref}
        />
      )}

      <ViewSwitcher
        vista={vista}
        date={focusDate}
        compatta={compatta}
        buildHref={(v, d, c) => buildHref(v, d, { compatta: c })}
      />

      {(vista === "giorno" || vista === "settimana") &&
        (() => {
          const dayBuckets = buildDayBuckets(vista, focusDate, occurrences);
          const { startHour, endHour } = computeVisibleHourWindow(dayBuckets, workingRanges);

          return compatta ? (
            <TimeGrid
              days={dayBuckets}
              workingRangesByWeekday={workingRanges}
              buildEventHref={(id) => buildHref(vista, focusDate, { evento: id, compatta })}
              startHour={startHour}
              endHour={endHour}
              compact
            />
          ) : (
            <AutoScrollToHour targetHour={earliestWorkingHour(workingRanges)} gridStartHour={startHour}>
              <TimeGrid
                days={dayBuckets}
                workingRangesByWeekday={workingRanges}
                buildEventHref={(id) => buildHref(vista, focusDate, { evento: id })}
                startHour={startHour}
                endHour={endHour}
              />
            </AutoScrollToHour>
          );
        })()}

      {vista === "mese" && (
        <MonthGrid
          monthStart={startOfMonth(focusDate)}
          occurrencesByDay={groupByDay(occurrences)}
          buildDayHref={(date) => buildHref("giorno", date)}
          buildEventHref={(id) => buildHref("mese", focusDate, { evento: id })}
        />
      )}

      {vista === "anno" && (
        <YearGrid
          year={focusDate.getFullYear()}
          occurrencesByDay={groupByDay(occurrences)}
          buildDayHref={(date) => buildHref("giorno", date)}
        />
      )}
    </div>
  );
}

function groupByDay(occurrences: Awaited<ReturnType<typeof getOccurrences>>) {
  const map = new Map<string, typeof occurrences>();
  for (const occurrence of occurrences) {
    const key = startOfDay(occurrence.start).toDateString();
    const list = map.get(key) ?? [];
    list.push(occurrence);
    map.set(key, list);
  }
  return map;
}

function buildDayBuckets(
  vista: "giorno" | "settimana",
  focusDate: Date,
  occurrences: Awaited<ReturnType<typeof getOccurrences>>
) {
  const days = vista === "giorno" ? [startOfDay(focusDate)] : weekDays(focusDate);
  return days.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    return {
      date,
      occurrences: occurrences.filter((o) => o.start < dayEnd && o.end > dayStart),
    };
  });
}

function weekDays(focusDate: Date) {
  const { start } = getVistaRange("settimana", focusDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function earliestWorkingHour(workingRanges: Map<number, { start: number; end: number }[]>) {
  let earliest = Infinity;
  for (const ranges of workingRanges.values()) {
    for (const range of ranges) earliest = Math.min(earliest, range.start);
  }
  return Number.isFinite(earliest) ? Math.floor(earliest / 60) : 8;
}
