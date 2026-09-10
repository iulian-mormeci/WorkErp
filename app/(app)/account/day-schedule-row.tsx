"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { WorkSchedule } from "@/lib/generated/prisma/client";
import { addWorkScheduleSlot, deleteWorkScheduleSlot, type ActionState } from "./actions";

export function DayScheduleRow({
  giornoSettimana,
  label,
  slots,
}: {
  giornoSettimana: number;
  label: string;
  slots: WorkSchedule[];
}) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const addSlot = addWorkScheduleSlot.bind(null, giornoSettimana);
  const [state, formAction] = useActionState<ActionState, FormData>(async (prevState, formData) => {
    const result = await addSlot(prevState, formData);
    if (!result?.error) {
      formRef.current?.reset();
      setAdding(false);
    }
    return result;
  }, undefined);

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
      <p className="w-28 shrink-0 text-sm font-medium text-ink">{label}</p>

      <div className="flex-1 space-y-2">
        {slots.length === 0 && !adding && <p className="text-sm text-muted">Nessun orario</p>}

        {slots.map((slot) => (
          <div key={slot.id} className="flex items-center gap-2">
            <span className="text-sm text-ink">
              {slot.oraInizio}–{slot.oraFine}
            </span>
            <button
              type="button"
              aria-label="Rimuovi fascia"
              disabled={isPending}
              onClick={() => startTransition(() => deleteWorkScheduleSlot(slot.id))}
              className="text-muted hover:text-danger disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {adding ? (
          <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              name="oraInizio"
              required
              className="rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink outline-none focus:border-pine"
            />
            <span className="text-sm text-muted">–</span>
            <input
              type="time"
              name="oraFine"
              required
              className="rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink outline-none focus:border-pine"
            />
            <button
              type="submit"
              className="rounded-md bg-pine-strong px-2 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              Aggiungi
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs text-muted hover:text-ink"
            >
              Annulla
            </button>
            {state?.error && <p className="w-full text-xs text-danger">{state.error}</p>}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-pine-strong hover:underline"
          >
            <Plus className="size-3.5" />
            Aggiungi fascia
          </button>
        )}
      </div>
    </div>
  );
}
