"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Note } from "@/lib/generated/prisma/client";
import { deleteNote, updateNote } from "./actions";

export function NoteItem({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateThisNote = updateNote.bind(null, note.id);
  const [state, formAction] = useActionState(updateThisNote, undefined);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await formAction(formData);
          setEditing(false);
        }}
        className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3"
      >
        <input
          name="titolo"
          defaultValue={note.titolo}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <textarea
          name="contenuto"
          defaultValue={note.contenuto}
          rows={5}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
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
    <div className="group flex flex-col rounded-md border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">{note.titolo}</p>
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
            disabled={isPending}
            onClick={() => startTransition(() => deleteNote(note.id))}
            className="rounded p-1 text-muted hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {note.contenuto && (
        <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm text-muted">
          {note.contenuto}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        Aggiornata il{" "}
        {note.updatedAt.toLocaleDateString("it-IT", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
