import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { NoteQuickAdd } from "./note-quick-add";
import { NoteItem } from "./note-item";

export default async function NotePage() {
  const user = await requireUser();

  const [notes, allUsers] = await Promise.all([
    prisma.note.findMany({
      where: { OR: [{ userId: user.id }, { shares: { some: { userId: user.id } } }] },
      include: {
        user: { select: { id: true, nome: true } },
        shares: { include: { user: { select: { id: true, nome: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Note</h1>
        <p className="mt-1 text-sm text-muted">Le tue note, personali o condivise.</p>
      </header>

      <NoteQuickAdd />

      {notes.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessuna nota qui. Aggiungine una qui sopra.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              currentUserId={user.id}
              owner={note.user}
              sharedWith={note.shares.map((s) => s.user)}
              allUsers={allUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
