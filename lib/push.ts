import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

// Come SMTP: se la configurazione manca o non è valida, le notifiche push
// si disattivano da sole (log e via) invece di far fallire ogni pagina che
// importa questo modulo — è già successo con una chiave VAPID scritta male
// (non URL-safe base64), che mandava in crash l'intera Impostazioni.
let configured = Boolean(publicKey && privateKey && subject);
if (configured) {
  try {
    webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  } catch (err) {
    configured = false;
    console.error("[push] VAPID non valide, notifiche push disattivate:", err);
  }
}

export function getVapidPublicKey(): string | null {
  return configured ? (publicKey ?? null) : null;
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
