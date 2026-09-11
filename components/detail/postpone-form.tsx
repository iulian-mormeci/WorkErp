"use client";

import { useActionState } from "react";

type PostponeState = { error?: string } | undefined;
type PostponeAction = (state: PostponeState, formData: FormData) => Promise<PostponeState>;

export function PostponeForm({
  action,
  defaultScadenza,
  defaultOraInizio,
  defaultOraFine,
  onDone,
}: {
  action: PostponeAction;
  defaultScadenza?: string;
  defaultOraInizio?: string;
  defaultOraFine?: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<PostponeState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Nuova scadenza</label>
        <input
          type="date"
          name="scadenza"
          defaultValue={defaultScadenza}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Fascia oraria (opzionale)</label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            name="oraInizio"
            defaultValue={defaultOraInizio}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <span className="text-sm text-muted">–</span>
          <input
            type="time"
            name="oraFine"
            defaultValue={defaultOraFine}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Posticipa"}
      </button>
    </form>
  );
}
