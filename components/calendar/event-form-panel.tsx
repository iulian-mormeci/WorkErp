"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Event } from "@/lib/generated/prisma/client";
import { createEvent, deleteEvent, updateEvent, type EventFormState } from "@/app/(app)/calendario/actions";

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function EventFormPanel({
  event,
  defaultDate,
  closeHref,
}: {
  event?: Event;
  defaultDate: Date;
  closeHref: string;
}) {
  const router = useRouter();
  const [tuttoIlGiorno, setTuttoIlGiorno] = useState(event?.tuttoIlGiorno ?? false);

  const boundAction = event ? updateEvent.bind(null, event.id) : createEvent;
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (!result?.error) router.push(closeHref);
      return result;
    },
    undefined
  );

  const start = event?.inizio ?? defaultDate;
  const end = event?.fine ?? new Date(defaultDate.getTime() + 60 * 60_000);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">{event ? "Modifica evento" : "Nuovo evento"}</h2>
        <button
          type="button"
          onClick={() => router.push(closeHref)}
          aria-label="Chiudi"
          className="text-muted hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        <input
          name="titolo"
          defaultValue={event?.titolo}
          placeholder="Titolo"
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="tuttoIlGiorno"
            checked={tuttoIlGiorno}
            onChange={(e) => setTuttoIlGiorno(e.target.checked)}
            className="size-4 rounded border-line"
          />
          Tutto il giorno
        </label>

        {tuttoIlGiorno ? (
          <input
            type="date"
            name="data"
            defaultValue={toDateOnly(start)}
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="datetime-local"
              name="inizio"
              defaultValue={toDatetimeLocal(start)}
              required
              className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            />
            <input
              type="datetime-local"
              name="fine"
              defaultValue={toDatetimeLocal(end)}
              required
              className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            />
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="luogo"
            defaultValue={event?.luogo ?? ""}
            placeholder="Luogo (opzionale)"
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <select
            name="tipo"
            defaultValue={event?.tipo ?? "EVENTO"}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          >
            <option value="EVENTO">Evento</option>
            <option value="ATTIVITA">Attività</option>
          </select>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Salvataggio…" : "Salva"}
        </button>
      </form>

      {/* Form separato: due <form> non possono essere annidati in HTML. */}
      {event && (
        <form action={deleteEvent.bind(null, event.id, closeHref)} className="mt-3">
          <button type="submit" className="text-sm text-danger hover:underline">
            Elimina evento
          </button>
        </form>
      )}
    </div>
  );
}
