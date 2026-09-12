// Formattazione di date/orari per input HTML, in base all'ora locale del
// browser (mai `toISOString()`, che scorpora sul fuso UTC e può mostrare il
// giorno sbagliato vicino alla mezzanotte).

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function toDatetimeLocalValue(date: Date): string {
  return `${toDateInputValue(date)}T${toTimeInputValue(date)}`;
}

export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

export function nowTimeInputValue(): string {
  return toTimeInputValue(new Date());
}
