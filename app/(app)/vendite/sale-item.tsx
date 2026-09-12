"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SaleWithItems } from "@/lib/sales";
import { computeSaleAmounts, formatCurrency, sumSaleLines } from "@/lib/sales";
import { deleteSale } from "./actions";

export function SaleItem({ sale, onEdit }: { sale: SaleWithItems; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();
  const imponibile = sumSaleLines(sale.items);
  const { iva, totaleLordo, provvigione } = computeSaleAmounts(imponibile, sale.aliquota);

  return (
    <div className="group flex items-start gap-3 rounded-md border border-line bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-ink">{sale.cliente}</p>
          <span className="text-xs text-muted">
            {sale.data.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {sale.dataConsegnaPrevista && (
            <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
              Consegna prevista{" "}
              {sale.dataConsegnaPrevista.toLocaleDateString("it-IT", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <ul className="mt-1.5 space-y-0.5">
          {sale.items.map((item) => (
            <li key={item.id} className="text-sm text-ink">
              {item.quantita}× {item.descrizione}{" "}
              <span className="text-muted">
                ({formatCurrency(item.prezzoUnitario)} cad. = {formatCurrency(item.quantita * item.prezzoUnitario)})
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-1.5 text-sm text-ink">
          {formatCurrency(imponibile)}{" "}
          <span className="text-muted">
            + IVA {sale.aliquota}% ({formatCurrency(iva)}) = {formatCurrency(totaleLordo)}
          </span>
        </p>
        <p className="mt-1 text-xs text-pine-strong">Tua provvigione: {formatCurrency(provvigione)}</p>
        {sale.note && <p className="mt-1 text-sm text-muted">{sale.note}</p>}
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Modifica"
          onClick={onEdit}
          className="rounded p-1 text-muted hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Elimina"
          disabled={isPending}
          onClick={() => startTransition(() => deleteSale(sale.id))}
          className="rounded p-1 text-muted hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
