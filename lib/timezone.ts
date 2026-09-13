/**
 * L'app non ha (né serve) un fuso orario configurabile per utente: è uno
 * strumento per un'attività italiana, orari e date di UnoERP, Attività,
 * Lavori e Calendario sono sempre civili italiani. Il fuso del *server* che
 * esegue il processo Node è un'altra cosa — in produzione, in Docker, è
 * quasi sempre UTC — e `Date.setHours()`/`new Date(y,m,d,h,min)` operano
 * proprio in quel fuso, non in quello italiano: un orario "11:00" inserito
 * o letto da UnoERP finirebbe salvato come 11:00 UTC, cioè le 13:00 ora
 * italiana (CEST) una volta visualizzato. Queste utility rendono esplicita
 * la conversione invece di affidarsi al fuso locale del server.
 */

/** Fuso orario civile dell'app: mai letto da una preferenza utente. */
export const APP_TIME_ZONE = "Europe/Rome";

/** Offset (minuti) di `timeZone` rispetto a UTC nell'istante rappresentato da `date`. */
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/** Anno/mese/giorno di `date` osservati in `timeZone` (non nel fuso del server). */
export function zonedYearMonthDay(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/** Minuti dalla mezzanotte di `date`, osservati in `timeZone` (non nel fuso del server). */
export function zonedMinutesSinceMidnight(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return Number(map.hour) * 60 + Number(map.minute);
}

/** Converte un orario "civile" Y/M/D + H:m in `timeZone` nel corrispondente istante UTC. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(naiveUtc), timeZone);
  return new Date(naiveUtc - offsetMinutes * 60_000);
}
