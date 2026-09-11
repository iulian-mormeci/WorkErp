"use client";

import { useActionState } from "react";
import { Trash2, Paperclip } from "lucide-react";
import type { Manual } from "@/lib/generated/prisma/client";
import { deleteManualAttachment, type ManualFormState } from "./actions";

type ManualAction = (
  state: ManualFormState,
  formData: FormData
) => Promise<ManualFormState>;

export function ManualForm({
  action,
  submitLabel,
  manual,
}: {
  action: ManualAction;
  submitLabel: string;
  manual?: Manual;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="space-y-6">
      {manual && manual.allegati.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Allegati</p>
          <ul className="space-y-1">
            {manual.allegati.map((path) => (
              <li
                key={path}
                className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2"
              >
                <a
                  href={`/api/uploads/${path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-pine-strong hover:underline"
                >
                  <Paperclip className="size-3.5" />
                  {path.split("/").pop()}
                </a>
                <form action={deleteManualAttachment.bind(null, manual.id, path)}>
                  <button
                    type="submit"
                    aria-label="Rimuovi allegato"
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-muted">Titolo</label>
          <input
            name="titolo"
            defaultValue={manual?.titolo}
            required
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            name="marca"
            defaultValue={manual?.marca ?? ""}
            placeholder="Marca"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            name="modello"
            defaultValue={manual?.modello ?? ""}
            placeholder="Modello"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            name="categoria"
            defaultValue={manual?.categoria ?? ""}
            placeholder="Categoria"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted">Contenuto (Markdown)</label>
          <textarea
            name="contenuto"
            defaultValue={manual?.contenuto ?? ""}
            rows={14}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted">
            {manual ? "Aggiungi altri allegati" : "Allegati"}
          </label>
          <input
            type="file"
            name="allegati"
            multiple
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={manual?.isPublic ?? false}
            className="mt-0.5 size-4 rounded border-line"
          />
          <span>
            Proponi nel catalogo pubblico
            <br />
            <span className="text-xs">
              Visibile agli altri utenti solo dopo l&apos;approvazione di un admin.
            </span>
          </span>
        </label>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
