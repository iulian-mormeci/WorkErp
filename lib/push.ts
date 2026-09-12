import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

const configured = Boolean(publicKey && privateKey && subject);
if (configured) {
  webpush.setVapidDetails(subject!, publicKey!, privateKey!);
}

export function getVapidPublicKey(): string | null {
  return publicKey ?? null;
}

export type PushPayload = { title: string; body: string; url?: string };

// Nessuna eccezione propagata: una notifica push non deve mai far fallire
// l'azione che l'ha innescata (es. salvare un posticipo) solo perché il
// dispositivo dell'utente non è più raggiungibile.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configured) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        // 404/410 = il push service dice che l'iscrizione non esiste più
        // (utente ha disinstallato/revocato il permesso altrove): la si
        // rimuove per non riprovare a vuoto ad ogni notifica futura.
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
