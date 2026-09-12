import Link from "next/link";
import { Plus, BookOpen, Library } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { Prisma } from "@/lib/generated/prisma/client";

type Filters = { q?: string; marca?: string; modello?: string; categoria?: string };

function myManualsScope(userId: string): Prisma.ManualWhereInput {
  return { OR: [{ ownerId: userId }, { library: { some: { userId } } }] };
}

async function distinctMarche(userId: string) {
  const rows = await prisma.manual.findMany({
    where: { marca: { not: null }, ...myManualsScope(userId) },
    select: { marca: true },
    distinct: ["marca"],
    orderBy: { marca: "asc" },
  });
  return rows.map((row) => row.marca).filter((value): value is string => Boolean(value));
}

async function distinctModelli(userId: string) {
  const rows = await prisma.manual.findMany({
    where: { modello: { not: null }, ...myManualsScope(userId) },
    select: { modello: true },
    distinct: ["modello"],
    orderBy: { modello: "asc" },
  });
  return rows.map((row) => row.modello).filter((value): value is string => Boolean(value));
}

async function distinctCategorie(userId: string) {
  const rows = await prisma.manual.findMany({
    where: { categoria: { not: null }, ...myManualsScope(userId) },
    select: { categoria: true },
    distinct: ["categoria"],
    orderBy: { categoria: "asc" },
  });
  return rows.map((row) => row.categoria).filter((value): value is string => Boolean(value));
}

export default async function ManualiPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const user = await requireUser();
  const filters = await searchParams;

  const [marche, modelli, categorie] = await Promise.all([
    distinctMarche(user.id),
    distinctModelli(user.id),
    distinctCategorie(user.id),
  ]);

  const manuali = await prisma.manual.findMany({
    where: {
      ...myManualsScope(user.id),
      ...(filters.q ? { titolo: { contains: filters.q, mode: "insensitive" } } : {}),
      ...(filters.marca ? { marca: filters.marca } : {}),
      ...(filters.modello ? { modello: filters.modello } : {}),
      ...(filters.categoria ? { categoria: filters.categoria } : {}),
    },
    orderBy: { titolo: "asc" },
  });

  const hasFilters = Boolean(filters.q || filters.marca || filters.modello || filters.categoria);

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Manuali e guide</h1>
          <p className="mt-1 text-sm text-muted">I tuoi manuali e quelli aggiunti dal catalogo.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/manuali/catalogo"
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
          >
            <Library className="size-4" />
            Catalogo
          </Link>
          <Link
            href="/manuali/nuovo"
            className="flex items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            Nuovo
          </Link>
        </div>
      </header>

      <form className="flex flex-col gap-2 sm:flex-row" method="get">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Cerca per titolo…"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <select
          name="marca"
          defaultValue={filters.marca ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Tutte le marche</option>
          {marche.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          name="modello"
          defaultValue={filters.modello ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Tutti i modelli</option>
          {modelli.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          name="categoria"
          defaultValue={filters.categoria ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Tutte le categorie</option>
          {categorie.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
        >
          Filtra
        </button>
        {hasFilters && (
          <Link
            href="/manuali"
            className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Azzera
          </Link>
        )}
      </form>

      {manuali.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
          <BookOpen className="size-6 text-muted" strokeWidth={1.5} />
          <p className="text-sm text-muted">
            {hasFilters
              ? "Nessun manuale corrisponde ai filtri."
              : "Nessun manuale ancora. Creane uno o aggiungine uno dal catalogo."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {manuali.map((manual) => (
            <Link
              key={manual.id}
              href={`/manuali/${manual.id}`}
              className="rounded-md border border-line bg-surface p-3 hover:border-pine"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm text-ink">{manual.titolo}</p>
                {manual.ownerId !== user.id && (
                  <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                    Dalla libreria
                  </span>
                )}
                {manual.ownerId === user.id && manual.isPublic && (
                  <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                    {manual.moderazioneStato === "APPROVATO"
                      ? "Pubblico"
                      : manual.moderazioneStato === "RIFIUTATO"
                        ? "Rifiutato"
                        : "In attesa di approvazione"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {[manual.marca, manual.modello, manual.categoria].filter(Boolean).join(" · ") ||
                  "Nessun dettaglio aggiuntivo"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
