"use client";

import { useActionState } from "react";
import type { Sale } from "@/lib/generated/prisma/client";
import { createSale, updateSale, type SaleFormState } from "./actions";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

type SaleAction = (state: SaleFormState, formData: FormData) => Promise<SaleFormState>;

export function SaleForm({ sale, onSuccess }: { sale?: Sale; onSuccess: () => void }) {
  const boundAction: SaleAction = sale ? updateSale.bind(null, sale.id) : createSale;
  const [state, formAction, pending] = useActionState<SaleFormState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (!result?.error) onSuccess();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Cliente</label>
        <input
          name="cliente"
          defaultValue={sale?.cliente}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-muted">Prezzo (IVA esclusa)</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
              €
            </span>
            <input
              type="number"
              name="prezzo"
              step="0.01"
              min="0"
              defaultValue={sale?.prezzo}
              required
              className="w-full rounded-md border border-line bg-paper py-2 pl-7 pr-3 text-sm text-ink outline-none focus:border-pine"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted">Aliquota IVA</label>
          <div className="relative">
            <input
              type="number"
              name="aliquota"
              step="0.01"
              min="0"
              max="100"
              defaultValue={sale?.aliquota ?? 22}
              required
              className="w-full rounded-md border border-line bg-paper py-2 pl-3 pr-7 text-sm text-ink outline-none focus:border-pine"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
              %
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Data vendita</label>
        <input
          type="date"
          name="data"
          defaultValue={toDateInputValue(sale?.data)}
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Note</label>
        <textarea
          name="note"
          defaultValue={sale?.note ?? ""}
          rows={3}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : sale ? "Salva modifiche" : "Registra vendita"}
      </button>
    </form>
  );
}
