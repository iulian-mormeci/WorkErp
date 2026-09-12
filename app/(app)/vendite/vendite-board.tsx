"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { SaleWithItems } from "@/lib/sales";
import { Drawer } from "@/components/ui/drawer";
import { SaleForm } from "./sale-form";
import { SaleItem } from "./sale-item";

type DrawerState = { mode: "create" } | { mode: "edit"; sale: SaleWithItems } | null;

export function VenditeBoard({ sales, children }: { sales: SaleWithItems[]; children?: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState>(null);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Vendite</h1>
          <p className="mt-1 text-sm text-muted">
            Le vendite effettuate per conto dell&apos;azienda e la tua provvigione.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawer({ mode: "create" })}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nuova vendita
        </button>
      </div>

      {children}

      {sales.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessuna vendita qui. Registrane una con il pulsante qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sales.map((sale) => (
            <SaleItem key={sale.id} sale={sale} onEdit={() => setDrawer({ mode: "edit", sale })} />
          ))}
        </div>
      )}

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "edit" ? "Modifica vendita" : "Nuova vendita"}
      >
        <SaleForm sale={drawer?.mode === "edit" ? drawer.sale : undefined} onSuccess={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}
