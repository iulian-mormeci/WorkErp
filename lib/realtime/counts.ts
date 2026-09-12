import { prisma } from "@/lib/prisma";
import { sendToUser } from "@/lib/realtime/hub";

// Una conversazione è "non letta" se contiene almeno un messaggio di un
// altro partecipante più recente di `lastReadAt` (mai letta -> qualunque
// messaggio altrui la rende non letta). I propri messaggi non contano.
async function countUnreadConversations(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (participations.length === 0) return 0;

  const results = await Promise.all(
    participations.map((p) =>
      prisma.message.findFirst({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
        select: { id: true },
      })
    )
  );
  return results.filter(Boolean).length;
}

// "Aperti/in corso/da iniziare": tutto tranne ciò che è chiuso in modo
// definitivo — completato per le Attività, completato o annullato per i
// Lavori (un lavoro annullato non è più "da fare").
export async function computeCounts(userId: string) {
  const [attivita, lavori, chat] = await Promise.all([
    prisma.task.count({ where: { userId, stato: { not: "COMPLETATO" } } }),
    prisma.job.count({ where: { userId, stato: { notIn: ["completato", "annullato"] } } }),
    countUnreadConversations(userId),
  ]);
  return { attivita, lavori, chat };
}

export async function pushCounts(userId: string) {
  const counts = await computeCounts(userId);
  sendToUser(userId, { type: "counts", ...counts });
}
