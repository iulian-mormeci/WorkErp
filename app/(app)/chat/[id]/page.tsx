import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { markConversationRead } from "../actions";
import { ThreadView } from "./thread-view";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true, nome: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  const isParticipant = conversation.participants.some((p) => p.userId === user.id);
  if (!isParticipant) notFound();

  await markConversationRead(id);

  const other = conversation.participants.find((p) => p.userId !== user.id)?.user;
  const title = conversation.isGroup ? (conversation.nome ?? "Gruppo") : (other?.nome ?? "Utente");
  const senderNames = Object.fromEntries(conversation.participants.map((p) => [p.userId, p.user.nome]));

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 px-6 py-8 md:px-10 md:py-10">
      <Link href="/chat" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Chat
      </Link>

      <header className="flex items-center gap-2 border-b border-line pb-3">
        {conversation.isGroup && <Users className="size-4 text-muted" />}
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {conversation.isGroup && (
          <span className="text-xs text-muted">
            {conversation.participants.map((p) => p.user.nome).join(", ")}
          </span>
        )}
      </header>

      <ThreadView
        conversationId={conversation.id}
        messages={conversation.messages}
        currentUserId={user.id}
        senderNames={senderNames}
      />
    </div>
  );
}
