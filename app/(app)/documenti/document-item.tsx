"use client";

import { useTransition } from "react";
import { Download, Pencil, Trash2, FileText } from "lucide-react";
import type { Document } from "@/lib/generated/prisma/client";
import { deleteDocument } from "./actions";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentItem({ document, onEdit }: { document: Document; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group flex items-start gap-3 rounded-md border border-line bg-surface p-3">
      <FileText className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm text-ink">{document.nomeOriginale}</p>
          <span className="text-xs text-muted">{formatSize(document.dimensione)}</span>
          <span className="text-xs text-muted">
            {document.createdAt.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        {(document.cartella || document.tag.length > 0) && (
          <p className="mt-1 text-xs text-muted">
            {[document.cartella, document.tag.join(", ")].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <a
          href={`/api/documenti/${document.id}`}
          aria-label="Scarica"
          className="rounded p-1 text-muted hover:text-ink"
        >
          <Download className="size-4" />
        </a>
        <button
          type="button"
          aria-label="Modifica"
          onClick={onEdit}
          className="rounded p-1 text-muted hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Elimina"
          disabled={isPending}
          onClick={() => startTransition(() => deleteDocument(document.id))}
          className="rounded p-1 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
