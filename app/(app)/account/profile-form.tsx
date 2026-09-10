"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";

export function ProfileForm({ nome, email }: { nome: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Nome</label>
        <input
          name="nome"
          defaultValue={nome}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-pine-strong">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva"}
      </button>
    </form>
  );
}
