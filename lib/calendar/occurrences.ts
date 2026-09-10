import { prisma } from "@/lib/prisma";
import type { EventType } from "@/lib/generated/prisma/enums";

export type OccurrenceSource = "event" | "task" | "job";
export type OccurrenceColor = "pine" | "amber" | "slate";

export type Occurrence = {
  id: string;
  source: OccurrenceSource;
  sourceId: string;
  titolo: string;
  start: Date;
  end: Date;
  allDay: boolean;
  colorToken: OccurrenceColor;
  /** Solo per source "event": serve all'editor per precompilare il tipo. */
  eventTipo?: EventType;
};

// Task/Job sono istanti (scadenza / programmatoIl), non intervalli: per
// disegnare un blocco visibile nella griglia oraria gli si dà una durata
// convenzionale fissa.
const DEFAULT_POINT_DURATION_MS = 30 * 60_000;

export async function getOccurrences(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<Occurrence[]> {
  const [events, tasks, jobs] = await Promise.all([
    prisma.event.findMany({
      where: { userId, inizio: { lt: rangeEnd }, fine: { gt: rangeStart } },
    }),
    prisma.task.findMany({
      where: { userId, scadenza: { gte: rangeStart, lt: rangeEnd } },
    }),
    prisma.job.findMany({
      where: { userId, programmatoIl: { gte: rangeStart, lt: rangeEnd } },
    }),
  ]);

  const eventOccurrences: Occurrence[] = events.map((e) => ({
    id: `event:${e.id}`,
    source: "event",
    sourceId: e.id,
    titolo: e.titolo,
    start: e.inizio,
    end: e.fine,
    allDay: e.tuttoIlGiorno,
    colorToken: "pine",
    eventTipo: e.tipo,
  }));

  const taskOccurrences: Occurrence[] = tasks.map((t) => ({
    id: `task:${t.id}`,
    source: "task",
    sourceId: t.id,
    titolo: t.titolo,
    start: t.scadenza as Date,
    end: new Date((t.scadenza as Date).getTime() + DEFAULT_POINT_DURATION_MS),
    allDay: false,
    colorToken: "slate",
  }));

  const jobOccurrences: Occurrence[] = jobs.map((j) => ({
    id: `job:${j.id}`,
    source: "job",
    sourceId: j.id,
    titolo: j.titolo,
    start: j.programmatoIl as Date,
    end: new Date((j.programmatoIl as Date).getTime() + DEFAULT_POINT_DURATION_MS),
    allDay: false,
    colorToken: "amber",
  }));

  return [...eventOccurrences, ...taskOccurrences, ...jobOccurrences].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
}
