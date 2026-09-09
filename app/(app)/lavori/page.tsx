import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { JobQuickAdd } from "./job-quick-add";
import { JobItem } from "./job-item";

export default async function LavoriPage() {
  const user = await requireUser();

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: [{ programmatoIl: "asc" }, { titolo: "asc" }],
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Lavori</h1>
        <p className="mt-1 text-sm text-muted">
          Lavori manuali e sincronizzati da UnoERP.
        </p>
      </header>

      <JobQuickAdd />

      {jobs.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessun lavoro qui. Aggiungine uno qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <JobItem key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
