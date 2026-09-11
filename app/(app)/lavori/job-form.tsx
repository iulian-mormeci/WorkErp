"use client";

import { useActionState } from "react";
import type { Job } from "@/lib/generated/prisma/client";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "@/lib/job-status";
import { createJob, updateJob, type JobFormState } from "./actions";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

type JobAction = (state: JobFormState, formData: FormData) => Promise<JobFormState>;

export function JobForm({ job, onSuccess }: { job?: Job; onSuccess: () => void }) {
  const boundAction: JobAction = job ? updateJob.bind(null, job.id) : createJob;
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (!result?.error) onSuccess();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Titolo</label>
        <input
          name="titolo"
          defaultValue={job?.titolo}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Cliente</label>
        <input
          name="cliente"
          defaultValue={job?.cliente ?? ""}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Indirizzo</label>
        <input
          name="indirizzo"
          defaultValue={job?.indirizzo ?? ""}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      {job && (
        <div className="space-y-1">
          <label className="text-sm text-muted">Stato</label>
          <select
            name="stato"
            defaultValue={job.stato}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          >
            {JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {JOB_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
      )}

      {job && (
        <div className="space-y-1">
          <label className="text-sm text-muted">Programmato il</label>
          <input
            type="date"
            name="programmatoIl"
            defaultValue={toDateInputValue(job.programmatoIl)}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-muted">Scadenza</label>
        <input
          type="date"
          name="scadenza"
          defaultValue={toDateInputValue(job?.scadenza)}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Fascia oraria disponibile (opzionale)</label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            name="oraInizio"
            defaultValue={job?.oraInizio ?? ""}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <span className="text-sm text-muted">–</span>
          <input
            type="time"
            name="oraFine"
            defaultValue={job?.oraFine ?? ""}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Note</label>
        <textarea
          name="note"
          defaultValue={job?.note ?? ""}
          rows={3}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : job ? "Salva modifiche" : "Crea lavoro"}
      </button>
    </form>
  );
}
