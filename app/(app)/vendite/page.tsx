import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { computeSaleAmounts, formatCurrency } from "@/lib/sales";
import { BarChart } from "@/components/charts/bar-chart";
import { VenditeBoard } from "./vendite-board";

type Filters = { cliente?: string; q?: string; dal?: string; al?: string };

async function distinctClienti(userId: string) {
  const rows = await prisma.sale.findMany({
    where: { userId },
    select: { cliente: true },
    distinct: ["cliente"],
    orderBy: { cliente: "asc" },
  });
  return rows.map((row) => row.cliente);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
}

export default async function VenditePage({ searchParams }: { searchParams: Promise<Filters> }) {
  const user = await requireUser();
  const filters = await searchParams;

  const clienti = await distinctClienti(user.id);

  const sales = await prisma.sale.findMany({
    where: {
      userId: user.id,
      ...(filters.cliente ? { cliente: filters.cliente } : {}),
      ...(filters.q
        ? {
            OR: [
              { cliente: { contains: filters.q, mode: "insensitive" } },
              { note: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.dal || filters.al
        ? {
            data: {
              ...(filters.dal ? { gte: new Date(filters.dal) } : {}),
              ...(filters.al ? { lte: new Date(`${filters.al}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { data: "desc" },
  });

  const hasFilters = Boolean(filters.cliente || filters.q || filters.dal || filters.al);

  const totals = sales.reduce(
    (acc, sale) => {
      const amounts = computeSaleAmounts(sale.prezzo, sale.aliquota);
      acc.imponibile += amounts.imponibile;
      acc.iva += amounts.iva;
      acc.totaleLordo += amounts.totaleLordo;
      acc.provvigione += amounts.provvigione;
      return acc;
    },
    { imponibile: 0, iva: 0, totaleLordo: 0, provvigione: 0 }
  );

  const monthlyMap = new Map<string, number>();
  for (const sale of sales) {
    const key = monthKey(sale.data);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + sale.prezzo);
  }
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, value]) => ({ label: monthLabel(new Date(`${key}-01`)), value }));

  const clienteMap = new Map<string, number>();
  for (const sale of sales) {
    clienteMap.set(sale.cliente, (clienteMap.get(sale.cliente) ?? 0) + sale.prezzo);
  }
  const clienteData = Array.from(clienteMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <VenditeBoard sales={sales}>
        <form className="flex flex-wrap gap-2" method="get">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Cerca per cliente o note…"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <select
            name="cliente"
            defaultValue={filters.cliente ?? ""}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          >
            <option value="">Tutti i clienti</option>
            {clienti.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="dal"
            defaultValue={filters.dal}
            aria-label="Dal"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <input
            type="date"
            name="al"
            defaultValue={filters.al}
            aria-label="Al"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <button
            type="submit"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
          >
            Filtra
          </button>
          {hasFilters && (
            <Link
              href="/vendite"
              className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted hover:text-ink"
            >
              Azzera
            </Link>
          )}
        </form>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-line bg-surface p-3">
            <p className="text-xs text-muted">Totale imponibile</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(totals.imponibile)}</p>
          </div>
          <div className="rounded-md border border-line bg-surface p-3">
            <p className="text-xs text-muted">IVA</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(totals.iva)}</p>
          </div>
          <div className="rounded-md border border-line bg-surface p-3">
            <p className="text-xs text-muted">Totale lordo</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(totals.totaleLordo)}</p>
          </div>
          <div className="rounded-md border border-pine/40 bg-pine/10 p-3">
            <p className="text-xs text-pine-strong">Tua provvigione (5%)</p>
            <p className="mt-1 text-lg font-semibold text-pine-strong">
              {formatCurrency(totals.provvigione)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-medium text-ink">Vendite per mese</p>
            <BarChart data={monthlyData} formatValue={(v) => formatCurrency(v)} />
          </div>
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-medium text-ink">Vendite per cliente</p>
            <BarChart data={clienteData} orientation="horizontal" formatValue={(v) => formatCurrency(v)} />
          </div>
        </div>
      </VenditeBoard>
    </div>
  );
}
