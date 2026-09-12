import { prisma } from "@/lib/prisma";
import { startDirectConversation, createGroupConversation } from "./actions";
import { GroupForm } from "./group-form";

export async function NewConversationPanel({ userId }: { userId: string }) {
  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: "asc" },
  });

  if (users.length === 0) {
    return <p className="text-sm text-muted">Non ci sono altri utenti nel gestionale.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-ink">Messaggio diretto</h3>
        <div className="flex flex-col gap-1">
          {users.map((u) => (
            <form key={u.id} action={startDirectConversation.bind(null, u.id)}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-md border border-line px-3 py-2 text-left text-sm text-ink hover:bg-paper"
              >
                <span>{u.nome}</span>
                <span className="text-xs text-muted">{u.email}</span>
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-line pt-4">
        <h3 className="text-sm font-medium text-ink">Nuovo gruppo</h3>
        <GroupForm users={users} action={createGroupConversation} />
      </div>
    </div>
  );
}
