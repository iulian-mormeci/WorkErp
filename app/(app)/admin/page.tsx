import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { approveManual, rejectManual } from "@/app/(app)/manuali/actions";
import { UserCreateForm } from "./user-create-form";
import { CategoryCreateForm } from "./category-create-form";

export default async function AdminPage() {
  await requireAdmin();

  const [users, categories, pendingManuals] = await Promise.all([
    prisma.user.findMany({
      include: { category: { select: { nome: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userCategory.findMany({ orderBy: { nome: "asc" } }),
    prisma.manual.findMany({
      where: { isPublic: true, moderazioneStato: "IN_ATTESA" },
      include: { owner: { select: { nome: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Amministrazione</h1>
        <p className="mt-1 text-sm text-muted">Utenti, categorie e moderazione del catalogo manuali.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Manuali in attesa di approvazione</h2>
        {pendingManuals.length === 0 ? (
          <p className="text-sm text-muted">Nessun manuale in attesa.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingManuals.map((manual) => (
              <div
                key={manual.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{manual.titolo}</p>
                  <p className="mt-0.5 text-xs text-muted">di {manual.owner.nome}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={approveManual.bind(null, manual.id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-pine-strong px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Approva
                    </button>
                  </form>
                  <form action={rejectManual.bind(null, manual.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-line px-3 py-1.5 text-xs text-danger hover:bg-paper"
                    >
                      Rifiuta
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Nuovo utente</h2>
        <div className="rounded-lg border border-line bg-surface p-4">
          <UserCreateForm categories={categories} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Categorie utente</h2>
        <div className="rounded-lg border border-line bg-surface p-4">
          <CategoryCreateForm />
          {categories.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.id} className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">
                  {c.nome}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Utenti</h2>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">
                  {u.nome} <span className="text-muted">· {u.email}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {u.ruolo === "ADMIN" ? "Admin" : "Utente"}
                  {u.category ? ` · ${u.category.nome}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
