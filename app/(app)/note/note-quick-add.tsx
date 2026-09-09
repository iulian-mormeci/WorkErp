"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";
import { createNote } from "./actions";

export function NoteQuickAdd() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      const result = await createNote(_prevState, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2 rounded-md border border-line bg-surface p-3"
    >
      <input
        name="titolo"
        placeholder="Titolo della nota…"
        required
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
      />
      <textarea
        name="contenuto"
        placeholder="Scrivi qualcosa…"
        rows={3}
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        <Plus className="size-4" />
        Aggiungi nota
      </button>
    </form>
  );
}
