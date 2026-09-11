"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CalendarClock } from "lucide-react";
import type { Task } from "@/lib/generated/prisma/client";
import { Drawer } from "@/components/ui/drawer";
import { PostponeForm } from "@/components/detail/postpone-form";
import { TaskForm } from "../task-form";
import { deleteTask, postponeTask } from "../actions";

type DrawerState = "edit" | "postpone" | null;

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function TaskDetailActions({ task }: { task: Task }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Posticipa"
          onClick={() => setDrawer("postpone")}
          className="rounded p-1.5 text-muted hover:text-ink"
        >
          <CalendarClock className="size-4" />
        </button>
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
              await deleteTask(task.id);
              router.push("/attivita");
            })
          }
          className="rounded p-1.5 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Drawer open={drawer === "edit"} onClose={() => setDrawer(null)} title="Modifica attività">
        <TaskForm task={task} onSuccess={() => setDrawer(null)} />
      </Drawer>

      <Drawer open={drawer === "postpone"} onClose={() => setDrawer(null)} title="Posticipa attività">
        <PostponeForm
          action={postponeTask.bind(null, task.id)}
          defaultScadenza={toDateInputValue(task.scadenza)}
          defaultOraInizio={task.oraInizio ?? undefined}
          defaultOraFine={task.oraFine ?? undefined}
          onDone={() => setDrawer(null)}
        />
      </Drawer>
    </>
  );
}
