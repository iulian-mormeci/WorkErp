import { prisma } from "@/lib/prisma";
import { sendToUser } from "@/lib/realtime/hub";

// "Aperti/in corso/da iniziare": tutto tranne ciò che è chiuso in modo
// definitivo — completato per le Attività, completato o annullato per i
// Lavori (un lavoro annullato non è più "da fare").
export async function computeCounts(userId: string) {
  const [attivita, lavori] = await Promise.all([
    prisma.task.count({ where: { userId, stato: { not: "COMPLETATO" } } }),
    prisma.job.count({ where: { userId, stato: { notIn: ["completato", "annullato"] } } }),
  ]);
  return { attivita, lavori };
}

export async function pushCounts(userId: string) {
  const counts = await computeCounts(userId);
  sendToUser(userId, { type: "counts", ...counts });
}
