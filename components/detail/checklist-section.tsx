"use client";

import { useRef, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@/lib/generated/prisma/client";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/app/(app)/checklist-actions";

export function ChecklistSection({
  items,
  taskId,
  jobId,
}: {
  items: ChecklistItem[];
  taskId?: string;
  jobId?: string;
}) {
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const boundAdd = addChecklistItem.bind(null, taskId ?? null, jobId ?? null);

  async function handleAdd(formData: FormData) {
    await boundAdd(formData);
    formRef.current?.reset();
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-ink">Checklist</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted">Nessuna voce.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2"
            >
              <input
                type="checkbox"
                checked={item.completato}
                onChange={() => startTransition(() => toggleChecklistItem(item.id))}
                className="size-4 shrink-0 accent-pine-strong"
              />
              <span
                className={`flex-1 text-sm ${item.completato ? "text-muted line-through" : "text-ink"}`}
              >
                {item.testo}
              </span>
              <button
                type="button"
                aria-label="Elimina voce"
                onClick={() => startTransition(() => deleteChecklistItem(item.id))}
                className="rounded p-1 text-muted opacity-0 hover:text-danger group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={(formData) => startTransition(() => handleAdd(formData))}
        className="flex gap-2"
      >
        <input
          name="testo"
          placeholder="Nuova voce…"
          className="flex-1 rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-pine"
        />
        <button
          type="submit"
          aria-label="Aggiungi voce"
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </div>
  );
}
