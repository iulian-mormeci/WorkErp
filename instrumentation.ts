/**
 * Hook di avvio del server Next.js (gira una volta all'avvio del processo
 * Node, non durante `next build`). Schedula la sync oraria di UnoERP
 * colpendo una route API locale invece di importare direttamente
 * lib/unoerp/sync.ts, così la vera logica di sync (fino a node:crypto
 * nell'helper di cifratura del token) resta dentro una normale Route
 * Handler solo-Node.js: `export const runtime = "nodejs"` qui sotto dice a
 * Next di compilare/eseguire questo file solo per il runtime Node, mai per
 * l'Edge Runtime (rilevante perché questo progetto ha anche proxy.ts).
 */
export const runtime = "nodejs";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const cron = await import("node-cron");

  cron.schedule("0 * * * *", () => {
    void triggerUnoErpCron();
  });

  console.log("[unoerp-cron] scheduled hourly sync");
}

async function triggerUnoErpCron() {
  const secret = process.env.UNOERP_CRON_SECRET;
  if (!secret) {
    console.error("[unoerp-cron] UNOERP_CRON_SECRET not set, skipping run");
    return;
  }
  const port = process.env.PORT ?? "3000";
  try {
    await fetch(`http://127.0.0.1:${port}/api/unoerp/cron`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
  } catch (e) {
    console.error("[unoerp-cron] trigger failed:", e instanceof Error ? e.message : String(e));
  }
}
