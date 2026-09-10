import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, startOfWeek } from "@/lib/calendar/grid";

export type CalendarVista = "giorno" | "settimana" | "mese" | "anno";

const VISTE: { value: CalendarVista; label: string }[] = [
  { value: "giorno", label: "Giorno" },
  { value: "settimana", label: "Settimana" },
  { value: "mese", label: "Mese" },
  { value: "anno", label: "Anno" },
];

function shiftDate(vista: CalendarVista, date: Date, direction: 1 | -1): Date {
  if (vista === "giorno") return addDays(date, direction);
  if (vista === "settimana") return addDays(date, 7 * direction);
  if (vista === "mese") return addMonths(date, direction);
  return new Date(date.getFullYear() + direction, date.getMonth(), date.getDate());
}

function periodLabel(vista: CalendarVista, date: Date): string {
  if (vista === "giorno") {
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  }
  if (vista === "settimana") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString("it-IT", { day: "numeric", month: sameMonth ? undefined : "short" });
    const endLabel = end.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }
  if (vista === "mese") {
    return date.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  }
  return String(date.getFullYear());
}

export function ViewSwitcher({
  vista,
  date,
  buildHref,
}: {
  vista: CalendarVista;
  date: Date;
  buildHref: (vista: CalendarVista, date: Date) => string;
}) {
  const prevHref = buildHref(vista, shiftDate(vista, date, -1));
  const nextHref = buildHref(vista, shiftDate(vista, date, 1));
  const todayHref = buildHref(vista, new Date());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <Link
          href={prevHref}
          aria-label="Periodo precedente"
          className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-ink"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={nextHref}
          aria-label="Periodo successivo"
          className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </Link>
        <Link
          href={todayHref}
          className="rounded-md border border-line px-2.5 py-1 text-sm text-ink hover:bg-paper"
        >
          Oggi
        </Link>
        <p className="ml-2 text-sm font-medium capitalize text-ink">{periodLabel(vista, date)}</p>
      </div>

      <div className="flex gap-1 rounded-md border border-line p-0.5">
        {VISTE.map((v) => (
          <Link
            key={v.value}
            href={buildHref(v.value, date)}
            className={`rounded px-2.5 py-1 text-sm ${
              v.value === vista ? "bg-pine-strong text-white" : "text-muted hover:text-ink"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function isCalendarVista(value: string | undefined): value is CalendarVista {
  return value === "giorno" || value === "settimana" || value === "mese" || value === "anno";
}
