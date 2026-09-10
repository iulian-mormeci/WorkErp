import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getOccurrences } from "@/lib/calendar/occurrences";
import { workingRangesByWeekday } from "@/lib/calendar/work-schedule";
import { addDays, formatDateParam, startOfDay } from "@/lib/calendar/grid";
import { TimeGrid } from "@/components/calendar/time-grid";
import { AutoScrollToHour } from "@/components/calendar/auto-scroll";

export default async function DashboardPage() {
  const user = await requireUser();

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [occurrences, schedules, tasksOggi] = await Promise.all([
    getOccurrences(user.id, today, tomorrow),
    prisma.workSchedule.findMany({ where: { userId: user.id } }),
    prisma.task.findMany({
      where: { userId: user.id, scadenza: { gte: today, lt: tomorrow }, stato: { not: "COMPLETATO" } },
      orderBy: { scadenza: "asc" },
    }),
  ]);

  const workingRanges = workingRangesByWeekday(schedules);
  const nuovoEventoHref = `/calendario?vista=giorno&data=${formatDateParam(today)}&evento=nuovo`;

  let earliestWorkingHour = 8;
  for (const ranges of workingRanges.values()) {
    for (const range of ranges) earliestWorkingHour = Math.min(earliestWorkingHour, Math.floor(range.start / 60));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 md:px-10 md:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/calendario"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
          >
            Calendario completo
          </Link>
          <Link
            href={nuovoEventoHref}
            className="rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Nuovo evento
          </Link>
        </div>
      </header>

      {tasksOggi.length > 0 && (
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="mb-2 text-sm font-medium text-ink">Da fare oggi</p>
          <ul className="space-y-1">
            {tasksOggi.map((task) => (
              <li key={task.id}>
                <Link href="/attivita" className="text-sm text-ink hover:text-pine-strong hover:underline">
                  {task.titolo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AutoScrollToHour hour={earliestWorkingHour}>
        <TimeGrid
          days={[{ date: today, occurrences }]}
          workingRangesByWeekday={workingRanges}
          buildEventHref={(id) => `/calendario?vista=giorno&data=${formatDateParam(today)}&evento=${id}`}
        />
      </AutoScrollToHour>
    </div>
  );
}
