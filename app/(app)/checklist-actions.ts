"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { recordTimelineEvent } from "@/lib/timeline";

// Un ChecklistItem appartiene esattamente a un Task o a un Job: la verifica
// di proprietà passa sempre dal genitore (Task/Job), la checklist non ha un
// userId proprio.
async function getOwnerUserId(item: { taskId: string | null; jobId: string | null }): Promise<string | null> {
  if (item.taskId) {
    const task = await prisma.task.findUnique({ where: { id: item.taskId }, select: { userId: true } });
    return task?.userId ?? null;
  }
  if (item.jobId) {
    const job = await prisma.job.findUnique({ where: { id: item.jobId }, select: { userId: true } });
    return job?.userId ?? null;
  }
  return null;
}

function detailPath(item: { taskId: string | null; jobId: string | null }) {
  return item.taskId ? `/attivita/${item.taskId}` : `/lavori/${item.jobId}`;
}

export async function addChecklistItem(taskId: string | null, jobId: string | null, formData: FormData) {
  const user = await requireUser();
  const testo = String(formData.get("testo") ?? "").trim();
  if (!testo) return;

  const ownerId = await getOwnerUserId({ taskId, jobId });
  if (ownerId !== user.id) return;

  const count = await prisma.checklistItem.count({
    where: taskId ? { taskId } : { jobId },
  });

  await prisma.checklistItem.create({
    data: { taskId, jobId, testo, ordine: count },
  });

  revalidatePath(detailPath({ taskId, jobId }));
}

export async function toggleChecklistItem(id: string) {
  const user = await requireUser();
  const item = await prisma.checklistItem.findUnique({ where: { id } });
  if (!item) return;

  const ownerId = await getOwnerUserId(item);
  if (ownerId !== user.id) return;

  const completato = !item.completato;
  await prisma.checklistItem.update({
    where: { id },
    data: { completato, completatoAt: completato ? new Date() : null },
  });

  if (completato) {
    await recordTimelineEvent(
      item.taskId ? { taskId: item.taskId } : { jobId: item.jobId! },
      "CHECKLIST_COMPLETATA",
      item.testo
    );
  }

  revalidatePath(detailPath(item));
}

export async function deleteChecklistItem(id: string) {
  const user = await requireUser();
  const item = await prisma.checklistItem.findUnique({ where: { id } });
  if (!item) return;

  const ownerId = await getOwnerUserId(item);
  if (ownerId !== user.id) return;

  await prisma.checklistItem.delete({ where: { id } });
  revalidatePath(detailPath(item));
}
