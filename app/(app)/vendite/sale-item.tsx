"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Sale } from "@/lib/generated/prisma/client";
import { computeSaleAmounts, formatCurrency } from "@/lib/sales";
import { deleteSale } from "./actions";

export function SaleItem({ sale, onEdit }: { sale: Sale; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { iva, totaleLordo, provvigione } = computeSaleAmounts(sale.prezzo, sale.aliquota);

  return (
    <div className="group flex items-start gap-3 rounded-md border border-line bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-ink">{sale.cliente}</p>
          <span className="text-xs text-muted">
            {sale.data.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink">
          {formatCurrency(sale.prezzo)}{" "}
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
