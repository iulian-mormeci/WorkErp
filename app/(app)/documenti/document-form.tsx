"use client";

import { useActionState } from "react";
import type { Document } from "@/lib/generated/prisma/client";
import { uploadDocument, updateDocumentMeta, type DocumentFormState } from "./actions";

type DocumentAction = (state: DocumentFormState, formData: FormData) => Promise<DocumentFormState>;

export function DocumentForm({
  document,
  onSuccess,
}: {
  document?: Document;
  onSuccess: () => void;
}) {
  const boundAction: DocumentAction = document ? updateDocumentMeta.bind(null, document.id) : uploadDocument;
  const [state, formAction, pending] = useActionState<DocumentFormState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (!result?.error) onSuccess();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      {!document && (
        <div className="space-y-1">
          <label className="text-sm text-muted">File</label>
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
          />
          <p className="text-xs text-muted">Massimo 100MB per file.</p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-muted">Cartella</label>
        <input
          name="cartella"
          defaultValue={document?.cartella}
          placeholder="es. Fatture/2026"
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Tag</label>
        <input
          name="tag"
          defaultValue={document?.tag.join(", ") ?? ""}
          placeholder="Separati da virgola"
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : document ? "Salva modifiche" : "Carica documento"}
      </button>
    </form>
  );
}
