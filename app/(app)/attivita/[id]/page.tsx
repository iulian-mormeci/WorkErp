import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { TASK_STATUS_LABEL } from "@/lib/task-status";
import { ChecklistSection } from "@/components/detail/checklist-section";
import { TimelineSection } from "@/components/detail/timeline-section";
import { TaskDetailActions } from "./task-detail-actions";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      checklistItems: { orderBy: { ordine: "asc" } },
      timelineEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!task || task.userId !== user.id) notFound();

  const overdue = task.scadenza && task.stato !== "COMPLETATO" && task.scadenza < new Date();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <Link href="/attivita" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Attività
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{task.titolo}</h1>
            <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
              {TASK_STATUS_LABEL[task.stato]}
            </span>
          </div>
          {task.descrizione && <p className="mt-1 text-sm text-muted">{task.descrizione}</p>}
          {(task.tag.length > 0 || task.scadenza) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {task.tag.map((tag) => (
                <span key={tag} className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                  {tag}
                </span>
              ))}
              {task.scadenza && (
                <span className={`text-xs ${overdue ? "text-danger" : "text-muted"}`}>
                  Scadenza{" "}
                  {task.scadenza.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                  {task.oraInizio && task.oraFine && ` · ${task.oraInizio}–${task.oraFine}`}
                </span>
              )}
            </div>
          )}
        </div>
        <TaskDetailActions task={task} />
      </header>

      <ChecklistSection items={task.checklistItems} taskId={task.id} />
      <TimelineSection events={task.timelineEvents} />
    </div>
  );
}
