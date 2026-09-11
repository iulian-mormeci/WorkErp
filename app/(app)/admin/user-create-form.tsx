"use client";

import { useActionState, useRef } from "react";
import type { UserCategory } from "@/lib/generated/prisma/client";
import { createUserByAdmin, type AdminFormState } from "./actions";

export function UserCreateForm({ categories }: { categories: UserCategory[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    async (prevState, formData) => {
      const result = await createUserByAdmin(prevState, formData);
      if (result?.success) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="nome"
          placeholder="Nome"
          required
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>
      <input
        name="password"
        type="password"
        placeholder="Password iniziale"
        required
        autoComplete="new-password"
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          name="ruolo"
          defaultValue="USER"
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="USER">Utente</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          name="categoryId"
          defaultValue=""
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Nessuna categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-pine-strong">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea utente"}
      </button>
    </form>
  );
}
