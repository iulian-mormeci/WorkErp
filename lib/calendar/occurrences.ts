import { prisma } from "@/lib/prisma";
import type { EventType } from "@/lib/generated/prisma/enums";
import { combineDateAndTime } from "@/lib/calendar/grid";
import { jobStatusLabel } from "@/lib/job-status";
import { TASK_STATUS_LABEL } from "@/lib/task-status";

export type OccurrenceSource = "event" | "task" | "job";
export type OccurrenceColor = "pine" | "amber" | "slate";

/** Dettagli aggiuntivi per il popup al passaggio del mouse (non servono alla griglia). */
export type OccurrenceDetail = {
  subtitle?: string;
  description?: string;
  stato?: string;
};

export type Occurrence = {
  id: string;
  source: OccurrenceSource;
  sourceId: string;
  titolo: string;
  start: Date;
  end: Date;
  allDay: boolean;
  colorToken: OccurrenceColor;
  detail: OccurrenceDetail;
  /** Solo per source "event": serve all'editor per precompilare il tipo. */
  eventTipo?: EventType;
};

// Task/Job senza una fascia oraria esplicita sono trattati come istanti
// (scadenza / programmatoIl): per disegnare comunque un blocco visibile
// nella griglia oraria gli si dà una durata convenzionale fissa.
const DEFAULT_POINT_DURATION_MS = 30 * 60_000;

export async function getOccurrences(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<Occurrence[]> {
  const dateInRange = { gte: rangeStart, lt: rangeEnd };

  const [events, tasks, jobs] = await Promise.all([
    prisma.event.findMany({
      where: { userId, inizio: { lt: rangeEnd }, fine: { gt: rangeStart } },
    }),
    prisma.task.findMany({
      where: { userId, scadenza: dateInRange },
    }),
    // Un Job compare in calendario se `programmatoIl` (quando/come è stato
    // effettivamente schedulato) o, in sua assenza, `scadenza` (la sola
    // scadenza impostata a mano) cade nel range.
    prisma.job.findMany({
      where: { userId, OR: [{ programmatoIl: dateInRange }, { scadenza: dateInRange }] },
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
    detail: { subtitle: e.luogo ?? undefined, description: e.descrizione ?? undefined },
  }));

  const taskOccurrences: Occurrence[] = tasks.map((t) => {
    const anchor = t.scadenza as Date;
    const hasFascia = t.oraInizio && t.oraFine;
    return {
      id: `task:${t.id}`,
      source: "task",
      sourceId: t.id,
      titolo: t.titolo,
      start: hasFascia ? combineDateAndTime(anchor, t.oraInizio!) : anchor,
      end: hasFascia
        ? combineDateAndTime(anchor, t.oraFine!)
        : new Date(anchor.getTime() + DEFAULT_POINT_DURATION_MS),
      allDay: false,
      colorToken: "slate",
      detail: {
        subtitle: t.tag.length > 0 ? t.tag.join(", ") : undefined,
        description: t.descrizione ?? undefined,
        stato: TASK_STATUS_LABEL[t.stato],
      },
    };
  });

  const jobOccurrences: Occurrence[] = jobs
    .map((j) => {
      const anchor = j.programmatoIl ?? j.scadenza;
      if (!anchor) return null;
      const hasFascia = j.oraInizio && j.oraFine;
      const occurrence: Occurrence = {
        id: `job:${j.id}`,
        source: "job",
        sourceId: j.id,
        titolo: j.titolo,
        start: hasFascia ? combineDateAndTime(anchor, j.oraInizio!) : anchor,
        end: hasFascia
          ? combineDateAndTime(anchor, j.oraFine!)
          : new Date(anchor.getTime() + DEFAULT_POINT_DURATION_MS),
        allDay: false,
        colorToken: "amber",
        detail: {
          subtitle: [j.cliente, j.indirizzo].filter(Boolean).join(" · ") || undefined,
          description: j.note ?? undefined,
          stato: jobStatusLabel(j.stato),
        },
      };
      return occurrence;
    })
    .filter((o): o is Occurrence => o !== null);

  return [...eventOccurrences, ...taskOccurrences, ...jobOccurrences].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
}
