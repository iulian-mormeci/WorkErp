import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { TaskStatus } from "@/lib/generated/prisma/enums";
import { TASK_STATUS_LABEL, TASK_STATUS_ORDER } from "@/lib/task-status";
import { TaskQuickAdd } from "./task-quick-add";
import { TaskItem } from "./task-item";

const FILTERS: { value: TaskStatus | "TUTTE"; label: string }[] = [
  { value: "TUTTE", label: "Tutte" },
  ...TASK_STATUS_ORDER.map((stato) => ({ value: stato, label: TASK_STATUS_LABEL[stato] })),
];

export default async function AttivitaPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>;
}) {
  const user = await requireUser();
  const { stato } = await searchParams;
  const activeFilter = TASK_STATUS_ORDER.includes(stato as TaskStatus)
    ? (stato as TaskStatus)
    : "TUTTE";

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      ...(activeFilter !== "TUTTE" ? { stato: activeFilter } : {}),
    },
    orderBy: [{ scadenza: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Attività</h1>
        <p className="mt-1 text-sm text-muted">
          Le tue attività, organizzate per stato.
        </p>
      </header>

      <TaskQuickAdd />

      <nav className="flex gap-1 border-b border-line">
        {FILTERS.map((filter) => {
          const href = filter.value === "TUTTE" ? "/attivita" : `/attivita?stato=${filter.value}`;
          const active = filter.value === activeFilter;
          return (
            <Link
              key={filter.value}
              href={href}
              className={`px-3 py-2 text-sm ${
                active
                  ? "border-b-2 border-pine font-medium text-pine-strong"
                  : "text-muted hover:text-ink"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {tasks.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessuna attività qui. Aggiungine una qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
