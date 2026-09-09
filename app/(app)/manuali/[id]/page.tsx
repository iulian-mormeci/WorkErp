import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { renderMarkdown } from "@/lib/markdown";
import { deleteManual } from "../actions";

export default async function ManualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const manual = await prisma.manual.findUnique({ where: { id } });
  if (!manual) notFound();

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
          <h1 className="text-xl font-semibold text-ink">{manual.titolo}</h1>
          <p className="mt-1 text-sm text-muted">
            {[manual.marca, manual.modello, manual.categoria].filter(Boolean).join(" · ") ||
              "Nessun dettaglio aggiuntivo"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
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
