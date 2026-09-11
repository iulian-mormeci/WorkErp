import Link from "next/link";
import { ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/calendar/grid";
import { WidgetShell } from "./widget-shell";

export async function ProssimeAttivitaWidget({ userId }: { userId: string }) {
  const today = startOfDay(new Date());

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      stato: { not: "COMPLETATO" },
      // "Prossime": esclude le attività la cui scadenza è già passata — una
      // senza scadenza resta comunque visibile, non essendo "nel passato".
      OR: [{ scadenza: { gte: today } }, { scadenza: null }],
    },
    orderBy: [{ scadenza: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: 5,
  });

  return (
    <WidgetShell title="Prossime attività" icon={ListChecks} href="/attivita">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">Nessuna attività da fare.</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link href="/attivita" className="block text-sm text-ink hover:text-pine-strong">
                <span className="truncate">{task.titolo}</span>
                {task.scadenza && (
                  <span className="ml-1.5 text-xs text-muted">
                    {task.scadenza.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
