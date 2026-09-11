// La provvigione è una quota fissa che l'utente guadagna su ogni vendita
// effettuata per conto dell'azienda per cui lavora (non una % configurabile).
export const PROVVIGIONE_RATE = 0.05;

export type SaleAmounts = {
  /** Imponibile, IVA esclusa — è il valore salvato in `Sale.prezzo`. */
  imponibile: number;
  iva: number;
  totaleLordo: number;
  /** Guadagno dell'utente: 5% dell'imponibile (la vendita non è "sua", è dell'azienda). */
  provvigione: number;
};

export function computeSaleAmounts(prezzo: number, aliquota: number): SaleAmounts {
  const iva = prezzo * (aliquota / 100);
  return {
    imponibile: prezzo,
    iva,
    totaleLordo: prezzo + iva,
    provvigione: prezzo * PROVVIGIONE_RATE,
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}
