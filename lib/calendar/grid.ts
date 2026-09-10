// Helper puri per il calendario: date native (nessuna libreria), calcoli di
// griglia oraria e distribuzione in colonne delle occorrenze sovrapposte.

/** Altezza in px di un'ora nella griglia (giorno/settimana). */
export const HOUR_ROW_HEIGHT_PX = 48;
export const DAY_GRID_HEIGHT_PX = HOUR_ROW_HEIGHT_PX * 24;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Lunedì come inizio settimana (convenzione italiana, coerente con l'ordine
// dei giorni già usato in Account per l'orario di lavoro).
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = domenica ... 6 = sabato
  const diff = (day + 6) % 7;
  return addDays(d, -diff);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** "2026-09-10" -> mezzanotte locale di quel giorno; input mancante/non valido -> oggi. */
export function parseDateParam(value: string | undefined): Date {
  if (value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      const [, y, m, d] = match;
      const parsed = new Date(Number(y), Number(m) - 1, Number(d));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  return startOfDay(new Date());
}

export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Range [start, end) da interrogare per popolare ciascuna vista del calendario. */
export function getVistaRange(
  vista: "giorno" | "settimana" | "mese" | "anno",
  date: Date
): { start: Date; end: Date } {
  if (vista === "giorno") {
    const start = startOfDay(date);
    return { start, end: addDays(start, 1) };
  }
  if (vista === "settimana") {
    const start = startOfWeek(date);
    return { start, end: addDays(start, 7) };
  }
  if (vista === "mese") {
    const start = startOfWeek(startOfMonth(date));
    return { start, end: addDays(start, 42) };
  }
  // anno: copre il margine di giorni fuori mese di gennaio e dicembre.
  const start = addDays(startOfYear(date), -7);
  const end = addDays(new Date(date.getFullYear(), 11, 31), 8);
  return { start, end };
}

export type Positioned<T> = T & { column: number; columns: number };

/**
 * Assegna a ogni occorrenza sovrapposta una colonna (0-based) e il numero
 * totale di colonne del suo gruppo, per poterle disporre affiancate nella
 * griglia oraria invece che sovrapposte. Algoritmo greedy: non è un
 * bin-packing ottimo, ma per il volume di occorrenze di un calendario
 * personale è più che sufficiente.
 */
export function packOverlaps<T extends { start: Date; end: Date }>(items: T[]): Positioned<T>[] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Ogni voce può comparire in più bucket giorno (un'occorrenza a cavallo di
  // mezzanotte) — costruisce sempre oggetti nuovi invece di scrivere su
  // `item` per non alterare l'occorrenza condivisa fra bucket diversi.
  let cluster: { item: T; column: number }[] = [];
  let columnEndTimes: number[] = [];
  let clusterEnd = -Infinity;
  const result: Positioned<T>[] = [];

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const totalColumns = columnEndTimes.length;
    for (const entry of cluster) {
      result.push({ ...entry.item, column: entry.column, columns: totalColumns });
    }
    cluster = [];
    columnEndTimes = [];
  };

  for (const item of sorted) {
    if (item.start.getTime() >= clusterEnd) {
      flushCluster();
      clusterEnd = item.end.getTime();
    } else {
      clusterEnd = Math.max(clusterEnd, item.end.getTime());
    }

    let col = columnEndTimes.findIndex((endTime) => endTime <= item.start.getTime());
    if (col === -1) {
      col = columnEndTimes.length;
      columnEndTimes.push(item.end.getTime());
    } else {
      columnEndTimes[col] = item.end.getTime();
    }
    cluster.push({ item, column: col });
  }
  flushCluster();

  return result;
}
