import type { Sale, SaleLine } from "@/lib/generated/prisma/client";

export type SaleWithItems = Sale & { items: SaleLine[] };

// La provvigione è una quota fissa che l'utente guadagna su ogni vendita
// effettuata per conto dell'azienda per cui lavora (non una % configurabile).
export const PROVVIGIONE_RATE = 0.05;

export type SaleAmounts = {
  /** Imponibile, IVA esclusa — somma di quantità × prezzo unitario di tutte le righe. */
  imponibile: number;
  iva: number;
  totaleLordo: number;
  /** Guadagno dell'utente: 5% dell'imponibile (la vendita non è "sua", è dell'azienda). */
  provvigione: number;
};

export type SaleLineInput = { quantita: number; prezzoUnitario: number };

export function sumSaleLines(items: SaleLineInput[]): number {
  return items.reduce((sum, item) => sum + item.quantita * item.prezzoUnitario, 0);
}

export function computeSaleAmounts(imponibile: number, aliquota: number): SaleAmounts {
  const iva = imponibile * (aliquota / 100);
  return {
    imponibile,
    iva,
    totaleLordo: imponibile + iva,
    provvigione: imponibile * PROVVIGIONE_RATE,
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}
