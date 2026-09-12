// Service worker per le notifiche push (Web Push/VAPID). Non fa caching
// dell'app — l'unico scopo è ricevere 'push' e mostrare la notifica anche a
// scheda chiusa, e aprire l'app al click.

self.addEventListener("push", (event) => {
  let payload = { title: "Workerp", body: "" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // payload non JSON: tiene i default sopra.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
