"use client";

import { useTransition } from "react";
import { Pencil, Trash2, MapPin } from "lucide-react";
import type { Job } from "@/lib/generated/prisma/client";
import { jobStatusLabel } from "@/lib/job-status";
import { deleteJob } from "./actions";

export function JobItem({ job, onEdit }: { job: Job; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

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
        {job.scadenza && (
          <p className="mt-1 text-xs text-muted">
            Scadenza{" "}
            {job.scadenza.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
            {job.oraInizio && job.oraFine && ` · ${job.oraInizio}–${job.oraFine}`}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Modifica"
          onClick={onEdit}
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
