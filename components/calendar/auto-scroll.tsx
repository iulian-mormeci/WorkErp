"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { HOUR_ROW_HEIGHT_PX } from "@/lib/calendar/grid";

/**
 * Scrolla il contenitore fino a poco prima di `targetHour` al primo render
 * (es. l'inizio dell'orario di lavoro). `gridStartHour` è la prima ora
 * mostrata dalla griglia (la finestra oraria calcolata può già partire da
 * un'ora diversa da mezzanotte), serve per convertire `targetHour` in una
 * posizione relativa al contenitore.
 */
export function AutoScrollToHour({
  targetHour,
  gridStartHour,
  children,
}: {
  targetHour: number;
  gridStartHour: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: Math.max(0, (targetHour - gridStartHour) * HOUR_ROW_HEIGHT_PX - 32) });
  }, [targetHour, gridStartHour]);

  // min-w-0 è necessario: dentro un genitore flex-col, senza, la larghezza
  // minima intrinseca della griglia oraria (7 colonne min-w-[8rem]) si
  // propaga al contenitore della pagina invece di restare confinata dentro
  // lo scroll orizzontale di questo elemento.
  return (
    <div ref={ref} className="min-w-0 max-h-[80vh] overflow-auto">
      {children}
    </div>
  );
}
