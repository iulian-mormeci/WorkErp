/**
 * Hook di avvio del server Next.js (gira una volta all'avvio del processo
 * Node, non durante `next build`). Schedula la sync oraria di UnoERP
 * colpendo una route API locale invece di importare direttamente
 * lib/unoerp/sync.ts: questo progetto ha anche proxy.ts, che fa compilare a
 * Next questo file anche per il pass Edge, dove tutto ciò che è raggiungibile
 * da quella catena di import (fino a node:crypto nell'helper di cifratura del
 * token) fallirebbe — l'Edge Runtime non supporta i moduli nativi `node:`.
 * Passando per /api/unoerp/cron la vera logica di sync resta dentro una
 * normale Route Handler solo-Node.js, e il grafo di import di questo file
 * resta banale.
 */
export const runtime = "nodejs";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  // `eval("require")` non esegue input esterno/dinamico: la stringa è un
  // letterale fisso, usato solo per nascondere questo require dal grafo di
  // import statico di webpack/Turbopack, cosicché il pass di compilazione
  // Edge non tenti mai di risolvere i moduli nativi di node-cron. Al vero
  // avvio, nel vero processo Node, il require normale funziona comunque.
  const nodeRequire: NodeRequire = eval("require");
  const cron = nodeRequire("node-cron") as typeof import("node-cron");

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
