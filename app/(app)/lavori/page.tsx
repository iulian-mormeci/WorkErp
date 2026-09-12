import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "@/lib/job-status";
import { LavoriBoard } from "./lavori-board";

type Filters = {
  stato?: string;
  cliente?: string;
  origine?: string;
  q?: string;
  dal?: string;
  al?: string;
};

async function distinctClienti(userId: string) {
  const rows = await prisma.job.findMany({
    where: { userId, cliente: { not: null } },
    select: { cliente: true },
    distinct: ["cliente"],
    orderBy: { cliente: "asc" },
  });
  return rows.map((row) => row.cliente).filter((value): value is string => Boolean(value));
}

export default async function LavoriPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const user = await requireUser();
  const filters = await searchParams;

  const clienti = await distinctClienti(user.id);

  const jobs = await prisma.job.findMany({
    where: {
      userId: user.id,
      ...(filters.stato ? { stato: filters.stato } : {}),
      ...(filters.cliente ? { cliente: filters.cliente } : {}),
      ...(filters.origine === "MANUALE" || filters.origine === "UNOERP"
        ? { origine: filters.origine }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { titolo: { contains: filters.q, mode: "insensitive" } },
              { note: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.dal || filters.al
        ? {
            programmatoIl: {
              ...(filters.dal ? { gte: new Date(filters.dal) } : {}),
              ...(filters.al ? { lte: new Date(`${filters.al}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    // "Dal più recente al più vecchio": la data del lavoro (programmatoIl),
    // con scadenza come riserva quando manca (Job non ha un proprio createdAt).
    // nulls "last" evita che i lavori senza data programmata/scadenza saltino in cima.
    orderBy: [
      { programmatoIl: { sort: "desc", nulls: "last" } },
      { scadenza: { sort: "desc", nulls: "last" } },
    ],
  });

  const hasFilters = Boolean(
    filters.stato || filters.cliente || filters.origine || filters.q || filters.dal || filters.al
  );

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <LavoriBoard jobs={jobs}>
      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Cerca per titolo o note…"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <select
          name="stato"
          defaultValue={filters.stato ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Tutti gli stati</option>
          {JOB_STATUSES.map((value) => (
            <option key={value} value={value}>
              {JOB_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
        <select
          name="cliente"
          defaultValue={filters.cliente ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Tutti i clienti</option>
          {clienti.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          name="origine"
          defaultValue={filters.origine ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Manuale e UnoERP</option>
          <option value="MANUALE">Manuale</option>
          <option value="UNOERP">UnoERP</option>
        </select>
        <input
          type="date"
          name="dal"
          defaultValue={filters.dal}
          aria-label="Programmato dal"
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <input
          type="date"
          name="al"
          defaultValue={filters.al}
          aria-label="Programmato al"
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <button
          type="submit"
          className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
        >
          Filtra
        </button>
        {hasFilters && (
          <Link
            href="/lavori"
            className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Azzera
          </Link>
        )}
      </form>
      </LavoriBoard>
    </div>
  );
}
