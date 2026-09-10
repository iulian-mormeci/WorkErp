"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, MapPin } from "lucide-react";
import type { Job } from "@/lib/generated/prisma/client";
import { JOB_STATUSES, JOB_STATUS_LABEL, jobStatusLabel } from "@/lib/job-status";
import { deleteJob, updateJob } from "./actions";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function JobItem({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateThisJob = updateJob.bind(null, job.id);
  const [state, formAction] = useActionState(updateThisJob, undefined);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await formAction(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-line bg-surface p-3"
      >
        <input
          name="titolo"
          defaultValue={job.titolo}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="cliente"
            defaultValue={job.cliente ?? ""}
            placeholder="Cliente"
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            name="indirizzo"
            defaultValue={job.indirizzo ?? ""}
            placeholder="Indirizzo"
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            name="stato"
            defaultValue={job.stato}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          >
            {JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {JOB_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="programmatoIl"
            defaultValue={toDateInputValue(job.programmatoIl)}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
        <textarea
          name="note"
          defaultValue={job.note ?? ""}
          placeholder="Note"
          rows={2}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-pine-strong px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            Annulla
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group flex items-start gap-3 rounded-md border border-line bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-ink">{job.titolo}</p>
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
            {jobStatusLabel(job.stato)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              job.origine === "UNOERP"
                ? "bg-amber/15 text-amber"
                : "bg-paper text-muted"
            }`}
          >
            {job.origine === "UNOERP" ? "UnoERP" : "Manuale"}
          </span>
        </div>
        {(job.cliente || job.indirizzo) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            {job.indirizzo && <MapPin className="size-3.5 shrink-0" />}
            {[job.cliente, job.indirizzo].filter(Boolean).join(" · ")}
          </p>
        )}
        {(job.categoria || job.priorita) && (
          <p className="mt-1 text-xs text-muted">
            {[job.categoria, job.priorita && `Priorità: ${job.priorita}`].filter(Boolean).join(" · ")}
          </p>
        )}
        {job.note && <p className="mt-1 text-sm text-muted">{job.note}</p>}
        {job.programmatoIl && (
          <p className="mt-1 text-xs text-muted">
            Programmato per il{" "}
            {job.programmatoIl.toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {(() => {
              const ora = job.programmatoIl.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Rome",
              });
              return ora !== "00:00" ? ` alle ${ora}` : "";
            })()}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Modifica"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Elimina"
          disabled={isPending}
          onClick={() => startTransition(() => deleteJob(job.id))}
          className="rounded p-1 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
