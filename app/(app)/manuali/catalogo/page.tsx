import Link from "next/link";
import { ArrowLeft, Library, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { addToLibrary } from "../actions";

export default async function CatalogoManualiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;

  const manuali = await prisma.manual.findMany({
    where: {
      isPublic: true,
      moderazioneStato: "APPROVATO",
      ...(q ? { titolo: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      owner: { select: { nome: true } },
      library: { where: { userId: user.id }, select: { userId: true } },
    },
    orderBy: { titolo: "asc" },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <Link href="/manuali" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Manuali e guide
      </Link>

      <header>
        <h1 className="text-xl font-semibold text-ink">Catalogo pubblico</h1>
        <p className="mt-1 text-sm text-muted">
          Manuali condivisi da altri utenti, approvati e pronti da aggiungere alla tua libreria.
        </p>
      </header>

      <form className="flex gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cerca per titolo…"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <button
          type="submit"
          className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
        >
          Cerca
        </button>
      </form>

      {manuali.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
          <Library className="size-6 text-muted" strokeWidth={1.5} />
          <p className="text-sm text-muted">Nessun manuale pubblico ancora.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {manuali.map((manual) => {
            const isOwner = manual.ownerId === user.id;
            const inLibrary = manual.library.length > 0;

            return (
              <div
                key={manual.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3"
              >
                <Link href={`/manuali/${manual.id}`} className="min-w-0 flex-1 hover:text-pine-strong">
                  <p className="truncate text-sm text-ink">{manual.titolo}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[manual.marca, manual.modello, manual.categoria].filter(Boolean).join(" · ")}
                    {manual.marca || manual.modello || manual.categoria ? " · " : ""}
                    di {manual.owner.nome}
                  </p>
                </Link>

                {isOwner ? (
                  <span className="shrink-0 text-xs text-muted">Tuo manuale</span>
                ) : inLibrary ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-pine-strong">
                    <Check className="size-3.5" />
                    In libreria
                  </span>
                ) : (
                  <form action={addToLibrary.bind(null, manual.id)}>
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs text-ink hover:bg-paper"
                    >
                      Aggiungi alla libreria
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
