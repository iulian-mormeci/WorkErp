"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { Document } from "@/lib/generated/prisma/client";
import { Drawer } from "@/components/ui/drawer";
import { DocumentForm } from "./document-form";
import { DocumentItem } from "./document-item";

type DrawerState = { mode: "upload" } | { mode: "edit"; document: Document } | null;

export function DocumentiBoard({ documents, children }: { documents: Document[]; children?: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState>(null);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Documenti</h1>
          <p className="mt-1 text-sm text-muted">
            I tuoi file, organizzati per cartella e tag — anche il tuo backup online.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawer({ mode: "upload" })}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Carica documento
        </button>
      </div>

      {children}

      {documents.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessun documento qui. Caricane uno con il pulsante qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              onEdit={() => setDrawer({ mode: "edit", document })}
            />
          ))}
        </div>
      )}

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "edit" ? "Modifica documento" : "Carica documento"}
      >
        <DocumentForm
          document={drawer?.mode === "edit" ? drawer.document : undefined}
          onSuccess={() => setDrawer(null)}
        />
      </Drawer>
    </>
  );
}
