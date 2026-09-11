"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Circle, CircleDot, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/lib/generated/prisma/client";
import { TASK_STATUS_LABEL, nextTaskStatus } from "@/lib/task-status";
import { deleteTask, setTaskStatus } from "./actions";

const STATUS_ICON = {
  DA_FARE: Circle,
  IN_CORSO: CircleDot,
  COMPLETATO: CheckCircle2,
} as const;

export function TaskItem({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

  const StatusIcon = STATUS_ICON[task.stato];
  const overdue =
    task.scadenza && task.stato !== "COMPLETATO" && task.scadenza < new Date();

  return (
    <div className="group flex items-start gap-3 rounded-md border border-line bg-surface p-3">
      <button
        type="button"
        aria-label={`Stato: ${TASK_STATUS_LABEL[task.stato]}`}
        disabled={isPending}
        onClick={() =>
          startTransition(() => setTaskStatus(task.id, nextTaskStatus(task.stato)))
        }
        className="mt-0.5 shrink-0 text-muted hover:text-pine-strong disabled:opacity-50"
      >
        <StatusIcon className="size-5" strokeWidth={1.75} />
      </button>

      <div className="min-w-0 flex-1">
        <Link
          href={`/attivita/${task.id}`}
          className={
            task.stato === "COMPLETATO"
              ? "text-sm text-muted line-through hover:underline"
              : "text-sm text-ink hover:underline"
          }
        >
          {task.titolo}
        </Link>
        {task.descrizione && (
          <p className="mt-0.5 text-sm text-muted">{task.descrizione}</p>
        )}
        {(task.tag.length > 0 || task.scadenza) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.tag.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
            {task.scadenza && (
              <span className={`text-xs ${overdue ? "text-danger" : "text-muted"}`}>
                {task.scadenza.toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "short",
                })}
                {task.oraInizio && task.oraFine && ` · ${task.oraInizio}–${task.oraFine}`}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Modifica"
          onClick={onEdit}
          className="rounded p-1 text-muted hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Elimina"
          disabled={isPending}
          onClick={() => startTransition(() => deleteTask(task.id))}
          className="rounded p-1 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
