import type { TimelineEvent } from "@/lib/generated/prisma/client";

const TIPO_LABEL: Record<TimelineEvent["tipo"], string> = {
  CREATO: "Creato",
  INIZIATO: "Iniziato",
  CHECKLIST_COMPLETATA: "Voce checklist completata",
  COMPLETATO: "Completato",
  POSTICIPATO: "Posticipato",
};

export function TimelineSection({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-ink">Timeline</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted">Nessun evento ancora.</p>
      ) : (
        <ul className="space-y-3 border-l border-line pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative text-sm">
              <span className="absolute -left-[1.1rem] top-1 size-2 rounded-full bg-pine" />
              <p className="text-ink">
                {TIPO_LABEL[event.tipo]}
                {event.dettaglio && <span className="text-muted"> — {event.dettaglio}</span>}
              </p>
              <p className="text-xs text-muted">
                {event.createdAt.toLocaleString("it-IT", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
