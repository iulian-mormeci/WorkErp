import { prisma } from "@/lib/prisma";
import type { TimelineEventTipo } from "@/lib/generated/prisma/enums";

type TimelineTarget = { taskId: string; jobId?: never } | { jobId: string; taskId?: never };

export async function recordTimelineEvent(
  target: TimelineTarget,
  tipo: TimelineEventTipo,
  dettaglio?: string
) {
  await prisma.timelineEvent.create({
    data: {
      taskId: target.taskId ?? null,
      jobId: target.jobId ?? null,
      tipo,
      dettaglio: dettaglio ?? null,
    },
  });
}
