"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, Share2, Users } from "lucide-react";
import type { Note } from "@/lib/generated/prisma/client";
import { Drawer } from "@/components/ui/drawer";
import { deleteNote, updateNote, setNoteShares } from "./actions";

type PersonRef = { id: string; nome: string };

export function NoteItem({
  note,
  currentUserId,
  owner,
  sharedWith,
  allUsers,
}: {
  note: Note;
  currentUserId: string;
  owner: PersonRef;
  sharedWith: PersonRef[];
  allUsers: PersonRef[];
}) {
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateThisNote = updateNote.bind(null, note.id);
  const [state, formAction] = useActionState(updateThisNote, undefined);

  const isOwner = owner.id === currentUserId;
  // Il proprietario può sempre modificare; un condiviso può farlo perché è
  // stato deciso col proprietario in fase di condivisione (lettura+modifica).
  const canEdit = isOwner || sharedWith.some((u) => u.id === currentUserId);

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
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{note.titolo}</p>
          {!isOwner ? (
            <span className="mt-0.5 inline-block rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
              Condivisa da {owner.nome}
            </span>
          ) : (
            sharedWith.length > 0 && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                <Users className="size-3" />
                {sharedWith.map((u) => u.nome).join(", ")}
              </span>
            )
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {isOwner && (
            <button
              type="button"
              aria-label="Condividi"
              onClick={() => setSharing(true)}
              className="rounded p-1 text-muted hover:text-ink"
            >
              <Share2 className="size-4" />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              aria-label="Modifica"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted hover:text-ink"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              aria-label="Elimina"
              disabled={isPending}
              onClick={() => startTransition(() => deleteNote(note.id))}
              className="rounded p-1 text-muted hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          )}
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

      {isOwner && (
        <Drawer open={sharing} onClose={() => setSharing(false)} title="Condividi nota">
          <form
            action={(formData) => startTransition(async () => {
              await setNoteShares(note.id, formData);
              setSharing(false);
            })}
            className="space-y-3"
          >
            <p className="text-sm text-muted">
              Chi selezioni potrà leggere e modificare questa nota (non eliminarla).
            </p>
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted">Non ci sono altri utenti nel gestionale.</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-line p-2">
                {allUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="condivisi"
                      value={u.id}
                      defaultChecked={sharedWith.some((s) => s.id === u.id)}
                      className="size-4 accent-pine-strong"
                    />
                    {u.nome}
                  </label>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Salva condivisione
            </button>
          </form>
        </Drawer>
      )}
    </div>
  );
}
