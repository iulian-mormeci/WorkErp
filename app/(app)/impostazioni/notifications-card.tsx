"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  saveNotificationPreferences,
  savePushSubscription,
  deletePushSubscription,
  sendTestPush,
} from "./notifiche-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Preferences = {
  scadenzaBrowser: boolean;
  scadenzaEmail: boolean;
  statoBrowser: boolean;
  statoEmail: boolean;
  posticipoBrowser: boolean;
  posticipoEmail: boolean;
};

const EVENTS: { key: "scadenza" | "stato" | "posticipo"; label: string }[] = [
  { key: "scadenza", label: "Scadenza in arrivo" },
  { key: "stato", label: "Cambio di stato" },
  { key: "posticipo", label: "Posticipazione" },
];

export function NotificationsCard({
  vapidPublicKey,
  preferences,
}: {
  vapidPublicKey: string | null;
  preferences: Preferences;
}) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSubscribed(false);
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(Boolean(sub));
    })();
  }, []);

  async function enablePush() {
    if (!vapidPublicKey) return;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permesso negato dal browser.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      await savePushSubscription(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      setSubscribed(true);
      setMessage(null);
    } catch {
      setMessage("Non è stato possibile attivare le notifiche su questo browser.");
    }
  }

  async function disablePush() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await deletePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setSubscribed(false);
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-medium text-ink">Notifiche</h2>
      <p className="mt-1 text-sm text-muted">
        Scegli quali eventi di Attività e Lavori vuoi ricevere via notifica browser o email.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {vapidPublicKey ? (
          subscribed ? (
            <button
              type="button"
              onClick={() => startTransition(disablePush)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper disabled:opacity-50"
            >
              <BellOff className="size-4" />
              Disattiva notifiche browser
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startTransition(enablePush)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-pine-strong px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              <Bell className="size-4" />
              Attiva notifiche browser
            </button>
          )
        ) : (
          <p className="text-sm text-muted">
            Notifiche push non configurate sul server (mancano le chiavi VAPID).
          </p>
        )}
        {subscribed && (
          <button
            type="button"
            onClick={() => startTransition(sendTestPush)}
            disabled={isPending}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-paper disabled:opacity-50"
          >
            Invia notifica di prova
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-sm text-danger">{message}</p>}

      <form action={saveNotificationPreferences} className="mt-5 space-y-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-2 font-normal">Evento</th>
              <th className="pb-2 font-normal">Browser</th>
              <th className="pb-2 font-normal">Email</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map(({ key, label }) => (
              <tr key={key} className="border-t border-line">
                <td className="py-2 text-ink">{label}</td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    name={`${key}Browser`}
                    defaultChecked={preferences[`${key}Browser` as const]}
                    className="size-4 accent-pine-strong"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    name={`${key}Email`}
                    defaultChecked={preferences[`${key}Email` as const]}
                    className="size-4 accent-pine-strong"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted">
          &ldquo;Email&rdquo; ha effetto solo se è stato configurato un SMTP nell&apos;ambiente del server.
        </p>
        <button
          type="submit"
          className="rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Salva preferenze
        </button>
      </form>
    </div>
  );
}
