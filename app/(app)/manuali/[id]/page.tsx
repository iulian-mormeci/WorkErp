import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Library, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { renderMarkdown } from "@/lib/markdown";
import { deleteManual, addToLibrary, removeFromLibrary } from "../actions";

export default async function ManualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const manual = await prisma.manual.findUnique({
    where: { id },
    include: {
      owner: { select: { nome: true } },
      library: { where: { userId: user.id }, select: { userId: true } },
    },
  });
  if (!manual) notFound();

  const isOwner = manual.ownerId === user.id;
  const inLibrary = manual.library.length > 0;
  const isApprovedPublic = manual.isPublic && manual.moderazioneStato === "APPROVATO";

  // Visibile solo a: proprietario, chi lo ha già in libreria, o chiunque se
  // pubblico e approvato (così si può aprire il dettaglio dal catalogo prima
  // di aggiungerlo).
  if (!isOwner && !inLibrary && !isApprovedPublic) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/manuali"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Manuali e guide
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{manual.titolo}</h1>
            {!isOwner && (
              <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                di {manual.owner.nome}
              </span>
            )}
            {isOwner && manual.isPublic && (
              <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                {manual.moderazioneStato === "APPROVATO"
                  ? "Pubblico"
                  : manual.moderazioneStato === "RIFIUTATO"
                    ? "Rifiutato dalla moderazione"
                    : "In attesa di approvazione"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {[manual.marca, manual.modello, manual.categoria].filter(Boolean).join(" · ") ||
              "Nessun dettaglio aggiuntivo"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isOwner && isApprovedPublic && (
            <>
              {inLibrary ? (
                <form action={removeFromLibrary.bind(null, manual.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-danger"
                  >
                    <Check className="size-4" />
                    Rimuovi dalla libreria
                  </button>
                </form>
              ) : (
                <form action={addToLibrary.bind(null, manual.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-md bg-pine-strong px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    <Library className="size-4" />
                    Aggiungi alla libreria
                  </button>
                </form>
              )}
            </>
          )}
          {isOwner && (
            <>
              <Link
                href={`/manuali/${manual.id}/modifica`}
                aria-label="Modifica"
                className="rounded p-1.5 text-muted hover:text-ink"
              >
                <Pencil className="size-4" />
              </Link>
              <form action={deleteManual.bind(null, manual.id)}>
                <button
                  type="submit"
                  aria-label="Elimina"
                  className="rounded p-1.5 text-muted hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      {manual.allegati.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {manual.allegati.map((path) => (
            <a
              key={path}
              href={`/api/uploads/${path}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-pine-strong hover:underline"
            >
              {path.split("/").pop()}
            </a>
          ))}
        </div>
      )}

      <div
        className="markdown-body text-sm text-ink"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(manual.contenuto) }}
      />
    </div>
  );
}
