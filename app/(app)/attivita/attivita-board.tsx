"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { Task } from "@/lib/generated/prisma/client";
import { Drawer } from "@/components/ui/drawer";
import { TaskForm } from "./task-form";
import { TaskItem } from "./task-item";

type DrawerState = { mode: "create" } | { mode: "edit"; task: Task } | null;

export function AttivitaBoard({ tasks, children }: { tasks: Task[]; children?: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState>(null);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Attività</h1>
          <p className="mt-1 text-sm text-muted">Le tue attività, organizzate per stato.</p>
        </div>
        <button
          type="button"
          onClick={() => setDrawer({ mode: "create" })}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nuova attività
        </button>
      </div>

      {children}

      {tasks.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessuna attività qui. Creane una con il pulsante qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={() => setDrawer({ mode: "edit", task })} />
          ))}
        </div>
      )}

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "edit" ? "Modifica attività" : "Nuova attività"}
      >
        <TaskForm
          task={drawer?.mode === "edit" ? drawer.task : undefined}
          onSuccess={() => setDrawer(null)}
        />
      </Drawer>
    </>
  );
}
