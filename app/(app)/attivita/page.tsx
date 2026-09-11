import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { TaskStatus } from "@/lib/generated/prisma/enums";
import { TASK_STATUS_LABEL, TASK_STATUS_ORDER } from "@/lib/task-status";
import { AttivitaBoard } from "./attivita-board";

const FILTERS: { value: TaskStatus | "TUTTE"; label: string }[] = [
  { value: "TUTTE", label: "Tutte" },
  ...TASK_STATUS_ORDER.map((stato) => ({ value: stato, label: TASK_STATUS_LABEL[stato] })),
];

type SearchParams = { stato?: string; q?: string; tag?: string; dal?: string; al?: string };

async function distinctTags(userId: string) {
  const tasks = await prisma.task.findMany({ where: { userId }, select: { tag: true } });
  return Array.from(new Set(tasks.flatMap((t) => t.tag))).sort();
}

export default async function AttivitaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const activeFilter = TASK_STATUS_ORDER.includes(filters.stato as TaskStatus)
    ? (filters.stato as TaskStatus)
    : "TUTTE";

  const tags = await distinctTags(user.id);

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      ...(activeFilter !== "TUTTE" ? { stato: activeFilter } : {}),
      ...(filters.tag ? { tag: { has: filters.tag } } : {}),
      ...(filters.q
        ? {
            OR: [
              { titolo: { contains: filters.q, mode: "insensitive" } },
              { descrizione: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.dal || filters.al
        ? {
            scadenza: {
              ...(filters.dal ? { gte: new Date(filters.dal) } : {}),
              ...(filters.al ? { lte: new Date(`${filters.al}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ scadenza: "asc" }, { createdAt: "desc" }],
  });

  const hasExtraFilters = Boolean(filters.q || filters.tag || filters.dal || filters.al);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <AttivitaBoard tasks={tasks}>
      <nav className="flex gap-1 border-b border-line">
        {FILTERS.map((filter) => {
          const params = new URLSearchParams();
          if (filter.value !== "TUTTE") params.set("stato", filter.value);
          if (filters.q) params.set("q", filters.q);
          if (filters.tag) params.set("tag", filters.tag);
          if (filters.dal) params.set("dal", filters.dal);
          if (filters.al) params.set("al", filters.al);
          const qs = params.toString();
          const active = filter.value === activeFilter;
          return (
            <Link
              key={filter.value}
              href={qs ? `/attivita?${qs}` : "/attivita"}
              className={`px-3 py-2 text-sm ${
                active
                  ? "border-b-2 border-pine font-medium text-pine-strong"
                  : "text-muted hover:text-ink"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <form className="flex flex-wrap gap-2" method="get">
        {activeFilter !== "TUTTE" && <input type="hidden" name="stato" value={activeFilter} />}
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Cerca per titolo o descrizione…"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <select
          name="tag"
          defaultValue={filters.tag ?? ""}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Tutti i tag</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="dal"
          defaultValue={filters.dal}
          aria-label="Scadenza dal"
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <input
          type="date"
          name="al"
          defaultValue={filters.al}
          aria-label="Scadenza al"
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
        <button
          type="submit"
          className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper"
        >
          Filtra
        </button>
        {hasExtraFilters && (
          <Link
            href={activeFilter !== "TUTTE" ? `/attivita?stato=${activeFilter}` : "/attivita"}
            className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Azzera
          </Link>
        )}
      </form>
      </AttivitaBoard>
    </div>
  );
}
