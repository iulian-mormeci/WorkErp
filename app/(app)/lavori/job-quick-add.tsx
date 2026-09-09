"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";
import { createJob } from "./actions";

export function JobQuickAdd() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      const result = await createJob(_prevState, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="titolo"
          placeholder="Nuovo lavoro…"
          required
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <input
          name="cliente"
          placeholder="Cliente (opzionale)"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" />
          Aggiungi
        </button>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
