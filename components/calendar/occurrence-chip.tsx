import Link from "next/link";
import type { Occurrence, OccurrenceColor } from "@/lib/calendar/occurrences";

const COLOR_CLASSES: Record<OccurrenceColor, string> = {
  pine: "border-pine/30 bg-pine/10 text-pine-strong",
  amber: "border-amber/30 bg-amber/10 text-amber",
  slate: "border-slate/30 bg-slate/10 text-slate",
};

export function occurrenceHref(occurrence: Occurrence, buildEventHref: (eventoId: string) => string) {
  if (occurrence.source === "event") return buildEventHref(occurrence.sourceId);
  if (occurrence.source === "task") return "/attivita";
  return "/lavori";
}

export function OccurrenceChip({
  occurrence,
  buildEventHref,
  className = "",
  fill = false,
}: {
  occurrence: Occurrence;
  buildEventHref: (eventoId: string) => string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <Link
      href={occurrenceHref(occurrence, buildEventHref)}
      className={`block truncate rounded border px-1.5 py-0.5 text-xs leading-tight hover:opacity-80 ${
        COLOR_CLASSES[occurrence.colorToken]
      } ${fill ? "h-full" : ""} ${className}`}
    >
      {occurrence.titolo}
    </Link>
  );
}
