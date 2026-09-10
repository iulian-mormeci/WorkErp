"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { HOUR_ROW_HEIGHT_PX } from "@/lib/calendar/grid";

/** Scrolla il contenitore fino a poco prima di `hour` al primo render (es. l'inizio dell'orario di lavoro). */
export function AutoScrollToHour({ hour, children }: { hour: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: Math.max(0, hour * HOUR_ROW_HEIGHT_PX - 32) });
  }, [hour]);

  // min-w-0 è necessario: dentro un genitore flex-col, senza, la larghezza
  // minima intrinseca della griglia oraria (7 colonne min-w-[8rem]) si
  // propaga al contenitore della pagina invece di restare confinata dentro
  // lo scroll orizzontale di questo elemento.
  return (
    <div ref={ref} className="min-w-0 max-h-[65vh] overflow-auto">
      {children}
    </div>
  );
}
