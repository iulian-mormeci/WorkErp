"use client";

import { useActionState } from "react";
import type { ChatFormState } from "./actions";

type Member = { id: string; nome: string; email: string };
type GroupAction = (state: ChatFormState, formData: FormData) => Promise<ChatFormState>;

export function GroupForm({ users, action }: { users: Member[]; action: GroupAction }) {
  const [state, formAction, pending] = useActionState<ChatFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Nome gruppo</label>
        <input
          name="nome"
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Partecipanti</label>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-line p-2">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="membri" value={u.id} className="size-4 accent-pine-strong" />
              {u.nome}
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea gruppo"}
      </button>
    </form>
  );
}
