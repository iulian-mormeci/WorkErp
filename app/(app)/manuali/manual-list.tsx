"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";

export type ManualListItem = {
  id: string;
  titolo: string;
  marca: string | null;
  modello: string | null;
  categoria: string | null;
  ownerId: string;
  isPublic: boolean;
  moderazioneStato: "IN_ATTESA" | "APPROVATO" | "RIFIUTATO";
  excerpt: string;
};

type HoverState = { item: ManualListItem; top: number; left: number; openUpward: boolean };

const TOOLTIP_WIDTH = 280;

/**
 * Anteprima al passaggio del mouse: mostra un estratto del contenuto del
 * manuale vicino alla riga, resa via portal in `document.body` (evita che
 * un antenato con `overflow` la tagli). Sparisce non appena il mouse esce
 * dalla riga — nessuno stato persistente, nessun click necessario.
 */
export function ManualList({
  manuali,
  currentUserId,
}: {
  manuali: ManualListItem[];
  currentUserId: string;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const handleEnter = (item: ManualListItem, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const openUpward = rect.top > window.innerHeight / 2;
    setHover({
      item,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - TOOLTIP_WIDTH - 8),
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      openUpward,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {manuali.map((manual) => (
        <Link
          key={manual.id}
          href={`/manuali/${manual.id}`}
          onMouseEnter={(e) => handleEnter(manual, e.currentTarget)}
          onMouseLeave={() => setHover(null)}
          className="rounded-md border border-line bg-surface p-3 hover:border-pine"
        >
          <div className="flex items-center gap-2">
            <p className="text-sm text-ink">{manual.titolo}</p>
            {manual.ownerId !== currentUserId && (
              <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">Dalla libreria</span>
            )}
            {manual.ownerId === currentUserId && manual.isPublic && (
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

      {hover &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 rounded-md border border-line bg-surface p-3 text-sm shadow-lg"
            style={{
              left: hover.left,
              width: TOOLTIP_WIDTH,
              top: hover.openUpward ? undefined : hover.top,
              bottom: hover.openUpward ? window.innerHeight - hover.top : undefined,
            }}
          >
            <p className="font-medium text-ink">{hover.item.titolo}</p>
            {(hover.item.marca || hover.item.modello || hover.item.categoria) && (
              <p className="mt-0.5 text-xs text-muted">
                {[hover.item.marca, hover.item.modello, hover.item.categoria].filter(Boolean).join(" · ")}
              </p>
            )}
            {hover.item.excerpt && (
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted">{hover.item.excerpt}</p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
