"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CalendarClock, CheckCircle2 } from "lucide-react";
import type { Job } from "@/lib/generated/prisma/client";
import { Drawer } from "@/components/ui/drawer";
import { PostponeForm } from "@/components/detail/postpone-form";
import { JobForm } from "../job-form";
import { deleteJob, postponeJob, closeJob } from "../actions";

type DrawerState = "edit" | "postpone" | null;

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function JobDetailActions({ job }: { job: Job }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [isPending, startTransition] = useTransition();
  const canPostpone = job.origine !== "UNOERP";

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        {job.stato !== "completato" && (
          <button
            type="button"
            aria-label="Completa"
            title="Segna come completato"
            disabled={isPending}
            onClick={() => startTransition(() => closeJob(job.id))}
            className="rounded p-1.5 text-muted hover:text-pine-strong"
          >
            <CheckCircle2 className="size-4" />
          </button>
        )}
        {canPostpone && (
          <button
            type="button"
            aria-label="Posticipa"
            onClick={() => setDrawer("postpone")}
            className="rounded p-1.5 text-muted hover:text-ink"
          >
            <CalendarClock className="size-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Modifica"
          onClick={() => setDrawer("edit")}
          className="rounded p-1.5 text-muted hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Elimina"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteJob(job.id);
              router.push("/lavori");
            })
          }
          className="rounded p-1.5 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Drawer open={drawer === "edit"} onClose={() => setDrawer(null)} title="Modifica lavoro">
        <JobForm job={job} onSuccess={() => setDrawer(null)} />
      </Drawer>

      {canPostpone && (
        <Drawer open={drawer === "postpone"} onClose={() => setDrawer(null)} title="Posticipa lavoro">
          <PostponeForm
            action={postponeJob.bind(null, job.id)}
            defaultScadenza={toDateInputValue(job.scadenza)}
            defaultOraInizio={job.oraInizio ?? undefined}
            defaultOraFine={job.oraFine ?? undefined}
            onDone={() => setDrawer(null)}
          />
        </Drawer>
      )}
    </>
  );
}
