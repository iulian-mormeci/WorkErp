import Link from "next/link";
import { Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/calendar/grid";
import { WidgetShell } from "./widget-shell";

export async function ProssimiLavoriWidget({ userId }: { userId: string }) {
  const today = startOfDay(new Date());

  const jobs = await prisma.job.findMany({
    where: {
      userId,
      stato: { not: "completato" },
      // "Prossimi": esclude i lavori la cui data effettiva (programmatoIl,
      // o scadenza in sua assenza) è già passata — un lavoro senza alcuna
      // data resta comunque visibile, non essendo "nel passato".
      OR: [
        { programmatoIl: { gte: today } },
        { programmatoIl: null, scadenza: { gte: today } },
        { programmatoIl: null, scadenza: null },
      ],
    },
    orderBy: [
      { programmatoIl: { sort: "asc", nulls: "last" } },
      { scadenza: { sort: "asc", nulls: "last" } },
    ],
    take: 5,
  });

  return (
    <WidgetShell title="Prossimi lavori" icon={Wrench} href="/lavori">
      {jobs.length === 0 ? (
        <p className="text-sm text-muted">Nessun lavoro in programma.</p>
      ) : (
        <ul className="space-y-1.5">
          {jobs.map((job) => {
            const date = job.programmatoIl ?? job.scadenza;
            return (
              <li key={job.id}>
                <Link href="/lavori" className="block text-sm text-ink hover:text-pine-strong">
                  <span className="truncate">{job.titolo}</span>
                  {date && (
                    <span className="ml-1.5 text-xs text-muted">
                      {date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetShell>
  );
}
