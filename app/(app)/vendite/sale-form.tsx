"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { SaleWithItems } from "@/lib/sales";
import { toDateInputValue, todayInputValue } from "@/lib/dates";
import { createSale, updateSale, type SaleFormState } from "./actions";

type SaleAction = (state: SaleFormState, formData: FormData) => Promise<SaleFormState>;

type ItemRow = { key: string; descrizione: string; quantita: string; prezzoUnitario: string };

function emptyRow(): ItemRow {
  return { key: crypto.randomUUID(), descrizione: "", quantita: "1", prezzoUnitario: "" };
}

export function SaleForm({ sale, onSuccess }: { sale?: SaleWithItems; onSuccess: () => void }) {
  const boundAction: SaleAction = sale ? updateSale.bind(null, sale.id) : createSale;
  const [state, formAction, pending] = useActionState<SaleFormState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (!result?.error) onSuccess();
      return result;
    },
    undefined
  );

  const [items, setItems] = useState<ItemRow[]>(() =>
    sale && sale.items.length > 0
      ? sale.items.map((item) => ({
          key: item.id,
          descrizione: item.descrizione,
          quantita: String(item.quantita),
          prezzoUnitario: String(item.prezzoUnitario),
        }))
      : [emptyRow()]
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

      <div className="space-y-2">
        <label className="text-sm text-muted">Articoli venduti</label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.key} className="flex items-start gap-2">
              <input
                name="descrizione"
                defaultValue={item.descrizione}
                placeholder="Articolo"
                required
                className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              />
              <input
                type="number"
                name="quantita"
                defaultValue={item.quantita}
                min="1"
                step="1"
                required
                aria-label="Quantità"
                className="w-20 rounded-md border border-line bg-paper px-2 py-2 text-sm text-ink outline-none focus:border-pine"
              />
              <div className="relative w-28">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-muted">
                  €
                </span>
                <input
                  type="number"
                  name="prezzoUnitario"
                  defaultValue={item.prezzoUnitario}
                  step="0.01"
                  min="0"
                  required
                  aria-label="Prezzo unitario"
                  className="w-full rounded-md border border-line bg-paper py-2 pl-6 pr-2 text-sm text-ink outline-none focus:border-pine"
                />
              </div>
              <button
                type="button"
                aria-label="Rimuovi articolo"
                disabled={items.length === 1}
                onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))}
                className="mt-1.5 shrink-0 rounded p-1 text-muted hover:text-danger disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems((rows) => [...rows, emptyRow()])}
          className="flex items-center gap-1.5 text-sm text-pine-strong hover:opacity-80"
        >
          <Plus className="size-4" />
          Aggiungi articolo
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted">Aliquota IVA</label>
        <div className="relative w-32">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-muted">Data vendita</label>
          <input
            type="date"
            name="data"
            defaultValue={toDateInputValue(sale?.data) || todayInputValue()}
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted">Consegna prevista</label>
          <input
            type="date"
            name="dataConsegnaPrevista"
            defaultValue={toDateInputValue(sale?.dataConsegnaPrevista)}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>
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
