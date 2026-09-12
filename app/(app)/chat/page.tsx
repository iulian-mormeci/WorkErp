import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ChatBoard } from "./chat-board";
import { NewConversationPanel } from "./new-conversation-panel";
import type { ConversationRow } from "./conversation-item";

export default async function ChatPage() {
  const user = await requireUser();

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, nome: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const conversations: ConversationRow[] = participations
    .map(({ conversation, lastReadAt }) => {
      const lastMessage = conversation.messages[0] ?? null;
      const other = conversation.participants.find((p) => p.userId !== user.id)?.user;
      const nome = conversation.isGroup ? (conversation.nome ?? "Gruppo") : (other?.nome ?? "Utente");
      const unread = Boolean(
        lastMessage && lastMessage.senderId !== user.id && (!lastReadAt || lastMessage.createdAt > lastReadAt)
      );
      return {
        id: conversation.id,
        nome,
        isGroup: conversation.isGroup,
        lastMessage: lastMessage?.testo ?? (lastMessage?.allegato ? "Allegato" : null),
        lastMessageAt: lastMessage?.createdAt ?? conversation.createdAt,
        unread,
      };
    })
    .sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <ChatBoard conversations={conversations}>
        <NewConversationPanel userId={user.id} />
      </ChatBoard>
    </div>
  );
}
