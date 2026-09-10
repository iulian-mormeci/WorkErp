/**
 * Il timestamp `dal` di UnoERP indica la mezzanotte di un giorno osservata nel
 * fuso orario dell'ERP (Europe/Rome), non nel fuso del server che esegue
 * questo codice. `Date.setHours()` opera nel fuso del processo Node — su un
 * server impostato su UTC questo sposterebbe silenziosamente tutto al giorno
 * prima per qualunque fuso avanti rispetto a UTC. Queste utility rendono
 * esplicita la conversione invece di affidarsi al fuso locale del server.
 */

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
