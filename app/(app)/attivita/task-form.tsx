"use client";

import { useActionState } from "react";
import type { Task } from "@/lib/generated/prisma/client";
import { createTask, updateTask, type TaskFormState } from "./actions";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

type TaskAction = (state: TaskFormState, formData: FormData) => Promise<TaskFormState>;

export function TaskForm({
  task,
  onSuccess,
}: {
  task?: Task;
  onSuccess: () => void;
}) {
  const boundAction: TaskAction = task ? updateTask.bind(null, task.id) : createTask;
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (!result?.error) onSuccess();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Titolo</label>
        <input
          name="titolo"
          defaultValue={task?.titolo}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Descrizione</label>
        <textarea
          name="descrizione"
          defaultValue={task?.descrizione ?? ""}
          rows={3}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Tag</label>
        <input
          name="tag"
          defaultValue={task?.tag.join(", ") ?? ""}
          placeholder="Separati da virgola"
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Scadenza</label>
        <input
          type="date"
          name="scadenza"
          defaultValue={toDateInputValue(task?.scadenza ?? null)}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Fascia oraria disponibile (opzionale)</label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            name="oraInizio"
            defaultValue={task?.oraInizio ?? ""}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <span className="text-sm text-muted">–</span>
          <input
            type="time"
            name="oraFine"
            defaultValue={task?.oraFine ?? ""}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : task ? "Salva modifiche" : "Crea attività"}
      </button>
    </form>
  );
}
