"use client";

import { useActionState, useRef } from "react";
import { createCategory, type AdminFormState } from "./actions";

export function CategoryCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    async (prevState, formData) => {
      const result = await createCategory(prevState, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="nome"
          placeholder="Nome categoria"
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        {state?.error && <p className="mt-1 text-sm text-danger">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper disabled:opacity-50"
      >
        Aggiungi
      </button>
    </form>
  );
}
