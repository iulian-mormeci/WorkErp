"use client";

import { useActionState, useState, useTransition } from "react";
import { Circle, CircleDot, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/lib/generated/prisma/client";
import { TASK_STATUS_LABEL, nextTaskStatus } from "@/lib/task-status";
import { deleteTask, setTaskStatus, updateTask } from "./actions";

const STATUS_ICON = {
  DA_FARE: Circle,
  IN_CORSO: CircleDot,
  COMPLETATO: CheckCircle2,
} as const;

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function TaskItem({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateThisTask = updateTask.bind(null, task.id);
  const [state, formAction] = useActionState(updateThisTask, undefined);

  const StatusIcon = STATUS_ICON[task.stato];
  const overdue =
    task.scadenza && task.stato !== "COMPLETATO" && task.scadenza < new Date();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await formAction(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-line bg-surface p-3"
      >
        <input
          name="titolo"
          defaultValue={task.titolo}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <textarea
          name="descrizione"
          defaultValue={task.descrizione ?? ""}
          placeholder="Descrizione (opzionale)"
          rows={2}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <div className="flex gap-2">
          <input
            name="tag"
            defaultValue={task.tag.join(", ")}
            placeholder="Tag separati da virgola"
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            type="date"
            name="scadenza"
            defaultValue={toDateInputValue(task.scadenza)}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-pine-strong px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            Annulla
          </button>
        </div>
      </form>
    );
  }

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
        <p
          className={
            task.stato === "COMPLETATO"
              ? "text-sm text-muted line-through"
              : "text-sm text-ink"
          }
        >
          {task.titolo}
        </p>
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
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Modifica"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Elimina"
          onClick={() => startTransition(() => deleteTask(task.id))}
          className="rounded p-1 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
