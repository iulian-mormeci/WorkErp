import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { DocumentiBoard } from "./documenti-board";

type Filters = { cartella?: string; tag?: string; q?: string };

async function distinctCartelle(userId: string) {
  const rows = await prisma.document.findMany({
    where: { userId, cartella: { not: "" } },
    select: { cartella: true },
    distinct: ["cartella"],
    orderBy: { cartella: "asc" },
  });
  return rows.map((row) => row.cartella);
}

async function distinctTags(userId: string) {
  const documents = await prisma.document.findMany({ where: { userId }, select: { tag: true } });
  return Array.from(new Set(documents.flatMap((d) => d.tag))).sort();
}

export default async function DocumentiPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const user = await requireUser();
  const filters = await searchParams;

  const [cartelle, tags] = await Promise.all([distinctCartelle(user.id), distinctTags(user.id)]);

  const documents = await prisma.document.findMany({
    where: {
      userId: user.id,
      ...(filters.cartella ? { cartella: filters.cartella } : {}),
      ...(filters.tag ? { tag: { has: filters.tag } } : {}),
      ...(filters.q ? { nomeOriginale: { contains: filters.q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const hasFilters = Boolean(filters.cartella || filters.tag || filters.q);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <DocumentiBoard documents={documents}>
        <form className="flex flex-wrap gap-2" method="get">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Cerca per nome file…"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
          <select
            name="cartella"
            defaultValue={filters.cartella ?? ""}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          >
            <option value="">Tutte le cartelle</option>
            {cartelle.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            name="tag"
            defaultValue={filters.tag ?? ""}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          >
            <option value="">Tutti i tag</option>
            {tags.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
          >
            Filtra
          </button>
          {hasFilters && (
            <Link
              href="/documenti"
              className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted hover:text-ink"
            >
              Azzera
            </Link>
          )}
        </form>
      </DocumentiBoard>
    </div>
  );
}
