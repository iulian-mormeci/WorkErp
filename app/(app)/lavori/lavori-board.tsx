"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { Job } from "@/lib/generated/prisma/client";
import { Drawer } from "@/components/ui/drawer";
import { JobForm } from "./job-form";
import { JobItem } from "./job-item";

type DrawerState = { mode: "create" } | { mode: "edit"; job: Job } | null;

export function LavoriBoard({ jobs, children }: { jobs: Job[]; children?: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState>(null);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Lavori</h1>
          <p className="mt-1 text-sm text-muted">Lavori manuali e sincronizzati da UnoERP.</p>
        </div>
        <button
          type="button"
          onClick={() => setDrawer({ mode: "create" })}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nuova lavorazione
        </button>
      </div>

      {children}

      {jobs.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessun lavoro qui. Creane uno con il pulsante qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <JobItem key={job.id} job={job} onEdit={() => setDrawer({ mode: "edit", job })} />
          ))}
        </div>
      )}

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "edit" ? "Modifica lavoro" : "Nuova lavorazione"}
      >
        <JobForm job={drawer?.mode === "edit" ? drawer.job : undefined} onSuccess={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}
